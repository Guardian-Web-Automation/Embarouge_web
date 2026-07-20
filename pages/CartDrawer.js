import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class CartDrawer extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    // The cart drawer that is currently open on screen
    this.openContainer = page.locator('details.cart-drawer-container[open]').first(); // class: cart-drawer-container + attribute: open

    // The store runs an A/B test and renders two cart copies (one hidden).
    // We always target the VISIBLE copy, so read the "Your Bag [n]" title and
    // product text from what the shopper actually sees.
    this.heading = this.openContainer.getByText(/your bag/i).filter({ visible: true }).first(); // text: "Your Bag [n]"

    this.cartIcon = page.locator('cart-drawer summary.header__icon').first();        // class: header__icon (cart toggle)

    this.checkoutButton = page
      .getByRole('button', { name: /checkout/i })                                    // role/text: button "Checkout"
      .or(page.getByRole('link', { name: /checkout/i }));                            // role/text: link "Checkout"
  }

  async waitUntilOpen() {
    await expect(this.openContainer).toBeVisible();
    await expect(this.heading).toBeVisible();
    // The cart fills via an AJAX call, so wait until the title shows at least
    // one item ("Your Bag [1]"). This works for both A/B cart layouts.
    await expect.poll(() => this.lineItemCount(), { timeout: 30_000 }).toBeGreaterThan(0);
  }

  // Open the cart. If it did not auto-open after Add To Bag, click the cart icon.
  async openCart() {
    const alreadyOpen = await this.openContainer.isVisible().catch(() => false);
    if (!alreadyOpen) {
      await this.cartIcon.click();
    }
    await this.waitUntilOpen();
  }

  // Read the number of items from the "Your Bag [n]" title
  async lineItemCount() {
    const text = await this.heading.innerText().catch(() => '');
    const match = text.match(/\[(\d+)\]/);
    return match ? Number(match[1]) : 0;
  }

  // Check the added product appears in the open cart drawer
  async assertProductInCart(expectedTitle) {
    const drawerText = (await this.openContainer.innerText()).toLowerCase();
    expect(drawerText).toContain(expectedTitle.toLowerCase());
  }
}
