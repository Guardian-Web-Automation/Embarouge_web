/*
 * User flow      : Collection Page → Click on ADD TO BAG
 * Test case      : Verify basic user complete work
 * Test step      : Click any product's ADD TO BAG from the Collection Page.
 * Expected result: User's product is added and the cart drawer opens with it.
 */

import { test, expect } from '@playwright/test';
import { CollectionPage } from '../pages/CollectionPage.js';
import { CartDrawer } from '../pages/CartDrawer.js';

test.describe('Smoke: Collection page → Add to cart @smoke', () => {
  test('user can add a product from the collection page to the cart', async ({ page }) => {
    const collection = new CollectionPage(page);
    const cart = new CartDrawer(page);

    // Step 1: Open the Collection page
    await collection.open();
    console.log('✓ Collection page opened');

    // Step 2: Click ADD TO BAG on the first product
    const addedTitle = await collection.addProductToBag(0);
    console.log(`✓ Clicked ADD TO BAG on: ${addedTitle}`);

    // Step 3: Cart drawer should open
    await cart.waitUntilOpen();
    console.log('✓ Cart drawer opened');

    // Step 4: Cart should have the added product
    const count = await cart.lineItemCount();
    expect(count).toBeGreaterThan(0);
    console.log(`✓ Cart has ${count} item(s)`);

    await cart.assertProductInCart(addedTitle);
    console.log(`✓ Cart contains: ${addedTitle}`);

    // Step 5: Checkout should be available
    await expect(cart.checkoutButton.first()).toBeVisible();
    console.log('✓ Checkout button is visible');
  });
});
