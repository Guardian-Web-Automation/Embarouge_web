import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config'; // loads the .env file (holds the 2Captcha API key)

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // Retry once so an occasional slow/throttled response doesn't fail the run.
  retries: 1,
  // list = console output, html = report folder, json = results file for Slack
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'results.json' }]],

  use: {
    baseURL: 'https://embarouge.in',
    headless: true,
    // Sends a secret header so a Cloudflare WAF rule can let our tests skip the
    // "Verify you are human" check. Only added if QA_BYPASS_TOKEN is set (.env / CI secret).
    extraHTTPHeaders: process.env.QA_BYPASS_TOKEN
      ? { 'x-qa-bypass': process.env.QA_BYPASS_TOKEN }
      : {},
    // Slow down each action so you can watch it. Default 0 (full speed).
    // Set SLOWMO (in ms) to slow down, e.g. SLOWMO=1000 for 1 second per step.
    launchOptions: {
      slowMo: Number(process.env.SLOWMO) || 0,
      // Hide the "automation" flag so Cloudflare is less likely to challenge us.
      args: ['--disable-blink-features=AutomationControlled'],
    },
    actionTimeout: 15_000,
    // Higher navigation timeout — the live store is slow/throttles heavy traffic.
    navigationTimeout: 60_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['iPhone 14 Pro Max'],
        viewport: { width: 430, height: 932 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
