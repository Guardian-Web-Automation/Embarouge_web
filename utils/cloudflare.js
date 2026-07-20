// Checks whether Cloudflare is blocking the page with its
// "Verify you are human" challenge.
//
// Note: this challenge is built to stop automation, so it cannot be reliably
// clicked or solved from code. The reliable fix is to allowlist the tests in
// Cloudflare (allowlist the test IP, or add a WAF rule that skips the check
// when the "x-qa-bypass" header is present). See README for setup.

async function challengeIsShowing(page) {
  // The challenge widget loads inside a Cloudflare iframe
  const frame = page.locator('iframe[src*="challenges.cloudflare.com"]').first();
  if (await frame.isVisible().catch(() => false)) return true;

  // Or the page text shows the verification message
  const text = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
  return text.includes('verify you are human') || text.includes('needs to be verified');
}

// If Cloudflare is blocking the page, stop with a clear, helpful error.
export async function solveCloudflareIfPresent(page) {
  // Give the page a moment in case Cloudflare clears on its own
  if (await challengeIsShowing(page)) {
    await page.waitForTimeout(3000);
  }

  if (await challengeIsShowing(page)) {
    throw new Error(
      'Blocked by Cloudflare "Verify you are human" challenge.\n' +
      'Fix: allowlist your test IP in Cloudflare, or add a WAF rule that skips ' +
      'the challenge when the "x-qa-bypass" header is present (set QA_BYPASS_TOKEN). ' +
      'See README for steps.'
    );
  }
}
