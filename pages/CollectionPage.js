import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { PATHS } from '../utils/urls.js';

export class CollectionPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    this.productGrid = page.locator('ul#product-grid');                         // id: product-grid
    this.productCards = this.productGrid.locator('li.grid__item');              // class: grid__item
    this.addToBagButtons = this.productCards.locator('add-to-cart.card--button'); // custom element <add-to-cart> + class: card--button
  }

  async open() {
    await this.goto(PATHS.shopAll);
    await this.dismissPopupsIfPresent();
    await expect(this.productGrid).toBeVisible();
    await expect(this.productCards.first()).toBeVisible();
  }

  async dismissPopupsIfPresent() {
    const closeButton = this.page.getByRole('button', { name: /close|no thanks|dismiss/i });
    if (await closeButton.first().isVisible().catch(() => false)) {
      await closeButton.first().click().catch(() => {});
    }
  }

  // Parts of a single product card (used to check a card is complete).
  cardImage(index = 0) {
    return this.productCards.nth(index).locator('img').first();                 // tag: img
  }

  cardName(index = 0) {
    return this.productCards.nth(index).locator('a.card-information__text').first(); // class: card-information__text
  }

  cardRating(index = 0) {
    return this.productCards.nth(index).locator('div.rating').first();          // class: rating
  }

  cardPrice(index = 0) {
    return this.productCards.nth(index).locator('div.price').first();           // class: price
  }

  cardAddToBag(index = 0) {
    return this.addToBagButtons.nth(index);                                     // custom element <add-to-cart>
  }

  // ---- Mobile Filter (the "Filter and sort" panel) ----

  // "FILTER" button that opens the panel
  get filterButton() {
    return this.page.locator('.mobile-facets__open').first();                 // class: mobile-facets__open
  }

  // "Availability" row that expands the In stock / Out of stock options
  get availabilityOption() {
    return this.page.getByRole('button', { name: 'Availability' });           // text: Availability
  }

  // "In stock" checkbox option
  get inStockOption() {
    return this.page.locator('label[for="Filter-Availability-mobile-1"]');    // for: Filter-Availability-mobile-1
  }

  // "APPLY" button at the bottom of the panel
  get applyButton() {
    return this.page.locator('.mobile-facets__footer button').last();         // class: mobile-facets__footer
  }

  // The "active filters" chip shown after applying, e.g. "Availability: In stock".
  // During the grid re-render the theme briefly adds the "hidden" class, so we
  // target the real (non-hidden) chip.
  get activeFilters() {
    return this.page.locator('.active-facets:not(.hidden)').first();          // class: active-facets (not hidden)
  }

  // Step: open the filter panel
  async openFilter() {
    await this.filterButton.click();
  }

  // Step: pick "In stock" availability and apply
  async filterByInStock() {
    await this.availabilityOption.click();
    await this.inStockOption.click();
    await this.applyButton.click();
    await this.page.waitForURL(/filter\.v\.availability/, { waitUntil: 'commit' });
    // wait until the filtered grid re-renders and the active filter chip shows
    await this.activeFilters.waitFor();
  }

  // "Price" row that expands the From / To price inputs
  get priceOption() {
    return this.page.getByRole('button', { name: 'Price' });                  // text: Price
  }

  get priceFromInput() {
    return this.page.locator('#Mobile-Filter-Price-GTE');                     // id: Mobile-Filter-Price-GTE
  }

  get priceToInput() {
    return this.page.locator('#Mobile-Filter-Price-LTE');                     // id: Mobile-Filter-Price-LTE
  }

  // "← back" control inside a filter sub-screen (returns to the filter list)
  get filterBackButton() {
    return this.page.locator('.mobile-facets__close-button:visible').first(); // class: mobile-facets__close-button
  }

  // Step: select BOTH In stock + a price range in one panel, then apply once
  async filterByInStockAndPrice(from, to) {
    // Availability -> In stock
    await this.availabilityOption.click();
    await this.inStockOption.click();
    await this.filterBackButton.click();     // back to the filter list

    // Price -> range
    await this.priceOption.click();
    await this.priceFromInput.fill(String(from));
    await this.priceToInput.fill(String(to));

    // Apply both at once
    await this.applyButton.click();
    await this.page.waitForURL(/filter\.v\.price\.gte=\d/, { waitUntil: 'commit' });
    await this.activeFilters.waitFor();
  }

  // Step: set a price range (From / To) and apply
  async filterByPrice(from, to) {
    await this.priceOption.click();
    await this.priceFromInput.fill(String(from));
    await this.priceToInput.fill(String(to));
    await this.applyButton.click();
    await this.page.waitForURL(/filter\.v\.price\.gte=\d/, { waitUntil: 'commit' });
    await this.activeFilters.waitFor();
  }

  // Read the applied filter text, e.g. "Availability: In stock"
  async getActiveFilterText() {
    return (await this.activeFilters.innerText()).replace(/\s+/g, ' ').trim();
  }

  // ---- Sorting ----
  // "SORT BY" trigger that opens the sort options
  get sortSummary() {
    return this.page.locator('.facet-filters__sort summary').first();        // class: facet-filters__sort
  }

  // Step: open Sort and pick an option by its sort_by value (e.g. "price-ascending")
  async selectSort(value) {
    await this.sortSummary.click();
    await this.page.locator(`label[for^="Filter-${value}-"]`).first().click();  // for: Filter-<value>-N
    // wait for the re-sorted grid to load (not just the URL change)
    await this.page.waitForURL(new RegExp(`sort_by=${value}`), { waitUntil: 'domcontentloaded' });
  }

  // Read every product's price as a number (first number in the price text)
  async getAllProductPrices() {
    const count = await this.productCards.count();
    const prices = [];
    for (let i = 0; i < count; i++) {
      const text = await this.cardPrice(i).innerText();
      const match = text.replace(/,/g, '').match(/\d+(\.\d+)?/);
      if (match) prices.push(Number(match[0]));
    }
    return prices;
  }

  // Returns true if the product prices are in low-to-high order
  async isSortedLowToHigh() {
    const prices = await this.getAllProductPrices();
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] < prices[i - 1]) {
        return false;
      }
    }
    return true;
  }

  // "Clear all" link in the active filters chip
  get clearAllButton() {
    return this.activeFilters.getByRole('link', { name: /clear all/i });      // text: Clear all
  }

  // Step: remove all applied filters
  async clearAllFilters() {
    await this.clearAllButton.click();
    await this.page.waitForURL((url) => !url.href.includes('filter.v'), { waitUntil: 'commit' });
  }

  // Read the cart badge number on the bag icon. Empty cart = no badge = 0.
  async getCartBadgeCount() {
    const badge = this.page.locator('.cart-count-bubble').first();             // class: cart-count-bubble
    if (!(await badge.isVisible().catch(() => false))) {
      return 0;
    }
    const text = await badge.innerText();
    const match = text.match(/\d+/); // take the first number from the text
    return match ? Number(match[0]) : 0;
  }

  async getProductTitle(index = 0) {
    const title = this.productCards.nth(index).locator('a.card-information__text').first(); // class: card-information__text
    return (await title.innerText()).trim();
  }

  // Click a product card to open its PDP (Product Detail Page).
  async openProduct(index = 0) {
    const title = await this.getProductTitle(index);
    const link = this.productCards.nth(index).locator('a.card-information__text').first(); // class: card-information__text
    await link.scrollIntoViewIfNeeded();
    await link.click();
    return title;
  }

  async addProductToBag(index = 0) {
    const title = await this.getProductTitle(index);
    const button = this.addToBagButtons.nth(index);

    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
    await button.click();

    return title;
  }
}
