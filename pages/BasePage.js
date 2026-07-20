import { handleCloudflare } from '../utils/cloudflare.js';

export class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    // The live store is sometimes slow on the first hit, so if the page
    // does not load in time, try opening it one more time.
    try {
      await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    } catch (error) {
      await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    }
    // If Cloudflare shows a "Verify you are human" page, solve it and continue.
    await handleCloudflare(this.page);
  }
}
