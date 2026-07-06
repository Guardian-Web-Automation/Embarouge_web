import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ProductPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    this.heading = page.locator('h2.product__heading');                         // class: product__heading

    // The PDP has 3 submit buttons that share the class product-form__submit:
    //   1) main "Add to bag"   2) sticky-cart "Add to bag"   3) "Add Bundle To Cart"
    // We match the EXACT text "Add to bag" so the bundle button is skipped,
    // then take the first one (main button).
    this.addToBagButton = page.getByRole('button', { name: 'Add to bag', exact: true }); // role/text: button "Add to bag"
  }

  // Confirm we landed on a product page and it loaded.
  async waitUntilLoaded() {
    await expect(this.page).toHaveURL(/\/products\//);
    await expect(this.heading.first()).toBeVisible();
  }

  async getTitle() {
    return (await this.heading.first().innerText()).trim();
  }

  async addToBag() {
    const button = this.addToBagButton.first();
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
    await button.click();
  }
}
