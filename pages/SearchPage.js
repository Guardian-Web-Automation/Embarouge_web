import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class SearchPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    // The magnifying-glass icon in the header that opens the search box
    this.searchIcon = page.locator('summary.header__icon--search').first();   // class: header__icon--search

    // The search text box inside the search modal
    this.searchInput = page.locator('search-modal .search__input').first();   // custom element <search-modal> + class: search__input

    // Product cards on the search results page (same grid as the collection page)
    this.productGrid = page.locator('ul#product-grid');                        // id: product-grid
    this.productCards = this.productGrid.locator('li.grid__item');             // class: grid__item
  }

  // Step 1: Click the search icon to open the search box
  async openSearch() {
    await this.searchIcon.click();
    await expect(this.searchInput).toBeVisible();
  }

  // Step 2 & 3: Type the keyword and press Enter to search
  async searchFor(keyword) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
    // wait until we land on the search results page (URL like /search?q=...)
    await this.page.waitForURL(/\/search\?.*q=/, { waitUntil: 'commit' });
    await expect(this.productGrid).toBeVisible();
  }

  // Read a product name from the results by index
  async getResultTitle(index = 0) {
    const title = this.productCards.nth(index).locator('a.card-information__text').first(); // class: card-information__text
    return (await title.innerText()).trim();
  }
}
