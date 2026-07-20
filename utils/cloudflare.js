/**
 * Cloudflare challenge handler using the 2Captcha service.
 *
 * Detects a Cloudflare "Just a moment..." / Turnstile challenge on the current
 * page, extracts the Turnstile sitekey, sends it to 2Captcha to be solved, then
 * injects the returned token and lets the page continue.
 *
 * Requirements:
 *   - TWOCAPTCHA_API_KEY must be set in your .env file.
 *   - Node 18+ (uses the global `fetch`).
 *
 * NOTE: For a site you own, configuring a Cloudflare WAF bypass rule for your
 * test traffic (by secret header or IP) is faster, free and more reliable than
 * solving the challenge on every run. Use this only when that isn't possible.
 */

const API_BASE = 'https://2captcha.com';
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 24; // ~2 minutes

/**
 * Returns true if the current page looks like a Cloudflare interstitial /
 * Turnstile challenge rather than the real site content.
 * @param {import('@playwright/test').Page} page
 */
async function isCloudflareChallenge(page) {
  const title = (await page.title().catch(() => '')) || '';
  if (/just a moment|attention required|checking your browser/i.test(title)) {
    return true;
  }
  // Turnstile widget present?
  const hasWidget = await page
    .locator('.cf-turnstile, [name="cf-turnstile-response"], iframe[src*="challenges.cloudflare.com"]')
    .first()
    .count()
    .then((c) => c > 0)
    .catch(() => false);
  return hasWidget;
}

/**
 * Extract the Turnstile sitekey from the challenge page.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string|null>}
 */
async function extractSitekey(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-sitekey]');
    if (el) return el.getAttribute('data-sitekey');
    // Managed-challenge pages embed the sitekey in an inline script param.
    const m = document.documentElement.innerHTML.match(/sitekey["']?\s*[:=]\s*["']([\w-]+)["']/i);
    return m ? m[1] : null;
  });
}

/**
 * Submit a Turnstile task to 2Captcha and poll until it is solved.
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.sitekey
 * @param {string} opts.pageurl
 * @param {string} [opts.action]
 * @param {string} [opts.data]  cdata / chlPageData when present
 * @param {string} [opts.userAgent]
 * @returns {Promise<string>} the Turnstile solution token
 */
async function solveTurnstile({ apiKey, sitekey, pageurl, action, data, userAgent }) {
  const inParams = new URLSearchParams({
    key: apiKey,
    method: 'turnstile',
    sitekey,
    pageurl,
    json: '1',
  });
  if (action) inParams.set('action', action);
  if (data) inParams.set('data', data);
  if (userAgent) inParams.set('userAgent', userAgent);

  const submit = await fetch(`${API_BASE}/in.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: inParams.toString(),
  }).then((r) => r.json());

  if (submit.status !== 1) {
    throw new Error(`2Captcha submit failed: ${submit.request || JSON.stringify(submit)}`);
  }
  const requestId = submit.request;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
    const poll = await fetch(
      `${API_BASE}/res.php?key=${encodeURIComponent(apiKey)}&action=get&id=${requestId}&json=1`
    ).then((r) => r.json());

    if (poll.status === 1) return poll.request; // solved token
    if (poll.request !== 'CAPCHA_NOT_READY') {
      throw new Error(`2Captcha solve failed: ${poll.request}`);
    }
  }
  throw new Error('2Captcha timed out waiting for a Turnstile solution');
}

/**
 * Detect and solve a Cloudflare challenge on the given page. No-op if the page
 * is not currently showing a challenge. Safe to call before/after navigation.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {number} [options.settleTimeout=8000] ms to wait for the page to clear
 * @returns {Promise<boolean>} true if a challenge was handled
 */
async function handleCloudflare(page, options = {}) {
  const { settleTimeout = 8000 } = options;

  if (!(await isCloudflareChallenge(page))) return false;

  const apiKey = process.env.TWOCAPTCHA_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Cloudflare challenge detected but TWOCAPTCHA_API_KEY is not set in .env'
    );
  }

  // Some managed challenges auto-clear after a few seconds — give them a chance
  // before spending a 2Captcha credit.
  await page.waitForTimeout(6000);
  if (!(await isCloudflareChallenge(page))) return true;

  const sitekey = await extractSitekey(page);
  if (!sitekey) {
    throw new Error('Cloudflare challenge detected but could not extract Turnstile sitekey');
  }

  const pageurl = page.url();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  // Optional extra params some challenges require.
  const action = await page
    .locator('[data-action]')
    .first()
    .getAttribute('data-action')
    .catch(() => null);
  const data = await page
    .locator('[data-cdata]')
    .first()
    .getAttribute('data-cdata')
    .catch(() => null);

  console.log(`[cloudflare] solving Turnstile (sitekey=${sitekey}) via 2Captcha...`);
  const token = await solveTurnstile({ apiKey, sitekey, pageurl, action, data, userAgent });

  // Inject the token into the response fields Cloudflare reads, then submit.
  await page.evaluate((t) => {
    document
      .querySelectorAll('[name="cf-turnstile-response"], #cf-turnstile-response')
      .forEach((el) => {
        el.value = t;
      });
    // Fire the JS callback if the widget registered one.
    if (window.turnstile && typeof window.turnstile.reset === 'function') {
      try {
        window.tsCallback && window.tsCallback(t);
      } catch (e) {
        /* ignore */
      }
    }
    const form = document.querySelector('form');
    if (form) form.submit();
  }, token);

  // Wait for the real page to load.
  await page
    .waitForFunction(
      () => !/just a moment|attention required|checking your browser/i.test(document.title),
      { timeout: settleTimeout }
    )
    .catch(() => {});

  console.log('[cloudflare] challenge cleared.');
  return true;
}

export { handleCloudflare, isCloudflareChallenge, solveTurnstile };
