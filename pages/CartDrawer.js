import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class CartDrawer extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    this.drawer = page.locator('cart-drawer');                                       // custom element <cart-drawer>
    this.openContainer = this.drawer.locator('details.cart-drawer-container[open]');  // class: cart-drawer-container + attribute: open
    // drawer renders A/B control + variant copies, so scope to the first
    this.heading = this.drawer.getByText(/your bag/i).first();                        // text: "Your Bag"

    this.cartIcon = this.drawer.locator('summary.header__icon').first();              // class: header__icon (cart toggle)

    this.lineItems = page.locator('cart-items li[data-handle]');                      // custom element <cart-items> + attribute: data-handle
    this.lineItemTitles = this.lineItems.locator('a.product-title');                  // class: product-title
    this.subtotal = page.locator('.cart-subtotal span.money');                        // class: cart-subtotal + class: money
    this.checkoutButton = page
      .getByRole('button', { name: /checkout/i })                                     // role/text: button "Checkout"
      .or(page.getByRole('link', { name: /checkout/i }));                             // role/text: link "Checkout"
  }

  async waitUntilOpen() {
    await expect(this.openContainer).toBeVisible();
    await expect(this.heading).toBeVisible();
    // The line items load via a separate cart AJAX call, which can be slow on
    // the live store, so give this one a longer wait (30s) than the default.
    await expect(this.lineItems.first()).toBeVisible({ timeout: 30_000 });
  }

  // Open the cart. If it did not auto-open after Add To Bag, click the cart icon.
  async openCart() {
    const alreadyOpen = await this.openContainer.isVisible().catch(() => false);
    if (!alreadyOpen) {
      await this.cartIcon.click();
    }
    await this.waitUntilOpen();
  }

  async lineItemCount() {
    return this.lineItems.count();
  }

  async getLineItemTitles() {
    return this.lineItemTitles.allInnerTexts();
  }

  async assertProductInCart(expectedTitle) {
    const titles = await this.getLineItemTitles();
    const cartText = titles.join(' ').toLowerCase();
    const expected = expectedTitle.toLowerCase();

    expect(cartText).toContain(expected);
  }
}
