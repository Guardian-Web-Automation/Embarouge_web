import { Solver } from '@2captcha/captcha-solver';

// Read the 2Captcha key from the .env file (loaded in playwright.config.js)
const solver = new Solver(process.env.TWOCAPTCHA_API_KEY || '');

// True if the current page is a Cloudflare "Verify you are human" page.
async function isCloudflareChallenge(page) {
  const title = (await page.title().catch(() => '')).toLowerCase();
  if (title.includes('just a moment')) return true;

  // The challenge also shows a Turnstile widget with a data-sitekey
  const widget = page.locator('[data-sitekey]').first();                       // attribute: data-sitekey
  return widget.isVisible().catch(() => false);
}

// If a Cloudflare challenge is showing, solve it with 2Captcha and continue.
// If there is no challenge, this does nothing.
export async function solveCloudflareIfPresent(page) {
  if (!(await isCloudflareChallenge(page))) return;

  console.log('⚠ Cloudflare challenge detected - solving with 2Captcha...');

  // We need the widget's sitekey and the current page URL to solve it
  const widget = page.locator('[data-sitekey]').first();
  const sitekey = await widget.getAttribute('data-sitekey').catch(() => null);
  const pageUrl = page.url();

  if (!sitekey) {
    // No sitekey means it is the interactive page - just wait for it to clear
    await page.waitForFunction(() => !document.title.toLowerCase().includes('just a moment'),
      null, { timeout: 60_000 }).catch(() => {});
    return;
  }

  // Ask 2Captcha to solve the Cloudflare Turnstile challenge
  const answer = await solver.cloudflareTurnstile({ pageurl: pageUrl, sitekey });

  // Put the returned token into the hidden response field so the page accepts it
  await page.evaluate((token) => {
    const input = document.querySelector('[name="cf-turnstile-response"]');
    if (input) input.value = token;
  }, answer.data);

  // Wait until Cloudflare lets us through to the real page
  await page.waitForLoadState('domcontentloaded');
  console.log('✓ Cloudflare challenge solved');
}
