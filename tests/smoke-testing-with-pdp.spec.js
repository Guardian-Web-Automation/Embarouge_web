/*
 * User flow      : Collection Page → PDP
 * Test case      : Verify product card redirects to PDP and adds a product from PDP
 * Test step      : Click any product card from the Collection Page, then click ATC on the PDP.
 * Expected result: User is redirected to the corresponding PDP and the item is visible in cart.
 */

import { test, expect } from '@playwright/test';
import { CollectionPage } from '../pages/CollectionPage.js';
import { ProductPage } from '../pages/ProductPage.js';
import { CartDrawer } from '../pages/CartDrawer.js';

test.describe('Smoke: Collection page → PDP → Add to cart @smoke', () => {
  test('user can open a product card and add it to the cart from the PDP', async ({ page }) => {
    const collection = new CollectionPage(page);
    const product = new ProductPage(page);
    const cart = new CartDrawer(page);

    // Step 1: Open the Collection page
    await collection.open();
    console.log('✓ Collection page opened');

    // Step 2: Click the first product card to open its PDP
    const cardTitle = await collection.openProduct(0);
    console.log(`✓ Clicked product card: ${cardTitle}`);

    // Step 3: PDP should load for that product
    await product.waitUntilLoaded();
    const pdpTitle = await product.getTitle();
    console.log(`✓ Redirected to PDP: ${pdpTitle}`);

    // Step 4: Click ADD TO BAG on the PDP
    await product.addToBag();
    console.log('✓ Clicked ADD TO BAG on PDP');

    // Step 5: Cart drawer should open with the product
    await cart.waitUntilOpen();
    const count = await cart.lineItemCount();
    expect(count).toBeGreaterThan(0);
    console.log(`✓ Cart has ${count} item(s)`);

    await cart.assertProductInCart(pdpTitle);
    console.log(`✓ Cart contains: ${pdpTitle}`);
  });
});
