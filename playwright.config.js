import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // Retry once so an occasional slow/throttled response doesn't fail the run.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'https://embarouge.in',
    headless: true,
    // Slow down each action so you can watch it. Default 0 (full speed).
    // Set SLOWMO (in ms) to slow down, e.g. SLOWMO=1000 for 1 second per step.
    launchOptions: {
      slowMo: Number(process.env.SLOWMO) || 0,
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
