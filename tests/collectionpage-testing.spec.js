// ============================================================
// Collection Page - All Test Scenarios
// Website : Embarouge (embarouge.in) - Mobile view
// Framework: Playwright + POM (Page Object Model)
// ============================================================

import { test, expect } from '@playwright/test';
import { CollectionPage } from '../pages/CollectionPage.js';
import { ProductPage } from '../pages/ProductPage.js';
import { CartDrawer } from '../pages/CartDrawer.js';
import { SearchPage } from '../pages/SearchPage.js';

test.describe('Collection Page - All Test Scenarios @smoke', () => {
  let collectionPage;
  let productPage;
  let cartDrawer;
  let searchPage;

  // Runs before every test: create fresh page objects
  test.beforeEach(async ({ page }) => {
    collectionPage = new CollectionPage(page);
    productPage = new ProductPage(page);
    cartDrawer = new CartDrawer(page);
    searchPage = new SearchPage(page);
  });


  // ============================================================
  // TC01 - Verify product listing is displayed
  // User flow      : Collection Page → Product Listing
  // Test step      : Open Collection Page and observe a product card.
  // Expected result: Card shows image, name, rating, price and Add To Bag.
  // ============================================================
  test('TC01 - Verify product listing is displayed', async ({ page }) => {
    await collectionPage.open();

    const cardCount = await collectionPage.productCards.count();
    expect(cardCount).toBeGreaterThan(0);

    await expect(collectionPage.cardImage(0)).toBeVisible();
    await expect(collectionPage.cardName(0)).toBeVisible();
    await expect(collectionPage.cardRating(0)).toBeVisible();
    await expect(collectionPage.cardPrice(0)).toBeVisible();
    await expect(collectionPage.cardAddToBag(0)).toBeVisible();

    console.log(`✓ TC01: ${cardCount} products listed, first card is complete`);
  });


  // ============================================================
  // TC02 - Verify product card redirects to PDP
  // User flow      : Collection Page → PDP
  // Test step      : Open Collection Page and click any product card.
  // Expected result: User is redirected to the corresponding PDP.
  // ============================================================
  test('TC02 - Verify product card redirects to PDP', async ({ page }) => {
    await collectionPage.open();

    const cardTitle = await collectionPage.openProduct(0);

    await productPage.waitUntilLoaded();
    expect(page.url()).toContain('/products/');

    const pdpTitle = await productPage.getTitle();
    expect(pdpTitle.toLowerCase()).toContain(cardTitle.toLowerCase());

    console.log(`✓ TC02: card "${cardTitle}" opened its PDP`);
  });


  // ============================================================
  // TC03 - Verify product can be added to cart from Collection Page
  // User flow      : Collection Page → Add To Bag → Cart
  // Test step      : Open Collection Page, click Add To Bag, open Cart.
  // Expected result: Selected product is added successfully in the Cart.
  // ============================================================
  test('TC03 - Verify product can be added to cart from Collection Page', async ({ page }) => {
    await collectionPage.open();

    const addedTitle = await collectionPage.addProductToBag(0);

    // Step 3: Open the cart (clicks the cart icon if it didn't auto-open)
    await cartDrawer.openCart();

    const count = await cartDrawer.lineItemCount();
    expect(count).toBeGreaterThan(0);

    await cartDrawer.assertProductInCart(addedTitle);

    console.log(`✓ TC03: "${addedTitle}" added to cart (${count} item)`);
  });


  // ============================================================
  // TC04 - Verify cart badge count updates after adding product
  // User flow      : Collection Page → Add To Bag
  // Test step      : Note current cart count, then click Add To Bag.
  // Expected result: Cart badge count increases correctly.
  // ============================================================
  test('TC04 - Verify cart badge count updates after adding product', async ({ page }) => {
    await collectionPage.open();

    // Step 1: Note current cart count
    const countBefore = await collectionPage.getCartBadgeCount();

    // Step 2: Click Add To Bag
    await collectionPage.addProductToBag(0);
    await cartDrawer.openCart();

    // Expected: badge count increased
    const countAfter = await collectionPage.getCartBadgeCount();
    expect(countAfter).toBeGreaterThan(countBefore);

    console.log(`✓ TC04: cart badge went ${countBefore} → ${countAfter}`);
  });


  // ============================================================
  // TC05 - Verify Availability filter functionality
  // User flow      : Collection Page → Filter
  // Test step      : Open Filter, select Availability (In stock), click Apply.
  // Expected result: Products are filtered according to selected availability.
  // ============================================================
  test('TC05 - Verify Availability filter functionality', async ({ page }) => {
    await collectionPage.open();

    // Step 1: Open Filter
    await collectionPage.openFilter();

    // Step 2 & 3: Select Availability "In stock" and Apply
    await collectionPage.filterByInStock();

    // Expected: URL reflects the availability filter
    expect(page.url()).toContain('filter.v.availability');

    // Expected: the page shows which filter is applied ("In stock")
    const activeFilter = await collectionPage.getActiveFilterText();
    expect(activeFilter.toLowerCase()).toContain('in stock');

    // Expected: filtered products are shown
    const count = await collectionPage.productCards.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✓ TC05: "In stock" filter applied, ${count} products shown`);
  });


  // ============================================================
  // TC06 - Verify Price filter functionality
  // User flow      : Collection Page → Filter
  // Test step      : Open Filter, select a Price range, click Apply.
  // Expected result: Products are filtered according to the selected price range.
  // ============================================================
  test('TC06 - Verify Price filter functionality', async ({ page }) => {
    await collectionPage.open();

    // Step 1: Open Filter
    await collectionPage.openFilter();

    // Step 2 & 3: Set price range (₹1000 - ₹2000) and Apply
    await collectionPage.filterByPrice(1000, 2000);

    // Expected: URL reflects the price range filter
    expect(page.url()).toContain('filter.v.price.gte=1000');
    expect(page.url()).toContain('filter.v.price.lte=2000');

    // Expected: filtered products are shown
    const count = await collectionPage.productCards.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✓ TC06: price filter ₹1000-₹2000 applied, ${count} products shown`);
  });


  // ============================================================
  // TC07 - Verify multiple filters can be applied together
  // User flow      : Collection Page → Filter
  // Test step      : Select multiple filters (Availability + Price), click Apply.
  // Expected result: Products matching all selected filters are displayed.
  // ============================================================
  test('TC07 - Verify multiple filters can be applied together', async ({ page }) => {
    await collectionPage.open();

    // Step 1: Select multiple filters (In stock + price range) in one panel
    await collectionPage.openFilter();
    await collectionPage.filterByInStockAndPrice(1000, 2000);

    // Expected: both filters are present in the URL
    expect(page.url()).toContain('filter.v.availability');
    expect(page.url()).toContain('filter.v.price.gte=1000');
    expect(page.url()).toContain('filter.v.price.lte=2000');

    // Expected: the page shows both applied filters
    const activeFilter = await collectionPage.getActiveFilterText();
    expect(activeFilter.toLowerCase()).toContain('in stock');

    // Expected: products matching all filters are shown
    const count = await collectionPage.productCards.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✓ TC07: In stock + price ₹1000-₹2000 applied, ${count} products shown`);
  });


  // ============================================================
  // TC08 - Verify Clear button removes all applied filters
  // User flow      : Collection Page → Filter
  // Test step      : Apply filters, then click Clear.
  // Expected result: All filters are removed and default listing is displayed.
  // ============================================================
  test('TC08 - Verify Clear button removes all applied filters', async ({ page }) => {
    await collectionPage.open();

    // Step 1: Apply a filter (In stock)
    await collectionPage.openFilter();
    await collectionPage.filterByInStock();
    expect(page.url()).toContain('filter.v.availability');

    // Step 2: Click Clear (removes all filters)
    await collectionPage.clearAllFilters();

    // Expected: no filters left in the URL
    expect(page.url()).not.toContain('filter.v.availability');

    // Expected: default listing is shown (active filter chip removed, products visible)
    await expect(collectionPage.activeFilters).toHaveCount(0);
    const count = await collectionPage.productCards.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✓ TC08: filters cleared, default listing shows ${count} products`);
  });


  // ============================================================
  // TC09 - Verify sorting option works correctly
  // User flow      : Collection Page → Sort
  // Test step      : Open Sort, select "Price, low to high", verify results.
  // Expected result: Products are sorted correctly (price low to high).
  // ============================================================
  test('TC09 - Verify sorting option works correctly', async ({ page }) => {
    await collectionPage.open();

    // Step 1 & 2: Open Sort and select "Price, low to high"
    await collectionPage.selectSort('price-ascending');

    // Expected: URL reflects the selected sort
    expect(page.url()).toContain('sort_by=price-ascending');

    // Step 3: Verify products are actually sorted low to high.
    // The grid re-sorts in the background, so keep checking (up to 30s) until sorted.
    await expect.poll(() => collectionPage.isSortedLowToHigh(), { timeout: 30_000 }).toBe(true);

    console.log('✓ TC09: products sorted by price low to high');
  });


  // ============================================================
  // TC10 - Verify filter and sorting work together
  // User flow      : Collection Page → Filter + Sort
  // Test step      : 1. Apply filter.  2. Apply sorting.
  // Expected result: Filtered products should remain correctly sorted.
  // ============================================================
  test('TC10 - Verify filter and sorting work together', async ({ page }) => {
    await collectionPage.open();

    // Step 1: Apply filter (In stock)
    await collectionPage.openFilter();
    await collectionPage.filterByInStock();
    expect(page.url()).toContain('filter.v.availability');

    // Step 2: Apply sorting (Price, low to high)
    await collectionPage.selectSort('price-ascending');
    expect(page.url()).toContain('sort_by=price-ascending');

    // Expected: both filter and sort stay together in the URL
    expect(page.url()).toContain('filter.v.availability');

    // Expected: filtered products are still there
    const count = await collectionPage.productCards.count();
    expect(count).toBeGreaterThan(0);

    // Expected: filtered products remain correctly sorted (low to high).
    // The grid re-sorts in the background, so keep checking (up to 30s) until sorted.
    await expect.poll(() => collectionPage.isSortedLowToHigh(), { timeout: 30_000 }).toBe(true);

    console.log(`✓ TC10: In stock filter + price sort work together, ${count} products sorted low to high`);
  });


  // ============================================================
  // TC11 - Verify user can search product using valid keyword
  // User flow      : Collection Page → Search
  // Test step      : 1. Click Search.  2. Enter keyword.  3. Search.
  // Expected result: Matching products should be displayed successfully.
  // ============================================================
  test('TC11 - Verify user can search product using valid keyword', async ({ page }) => {
    await collectionPage.open();

    // Step 1: Click the search icon
    await searchPage.openSearch();

    // Step 2 & 3: Enter a valid keyword and search
    const keyword = '22 North';
    await searchPage.searchFor(keyword);

    // Expected: search results URL contains the keyword
    expect(page.url()).toContain('/search');

    // Expected: matching products are displayed
    const count = await searchPage.productCards.count();
    expect(count).toBeGreaterThan(0);

    // Expected: the first result matches the searched keyword
    const firstTitle = await searchPage.getResultTitle(0);
    expect(firstTitle.toLowerCase()).toContain('north');

    console.log(`✓ TC11: search "${keyword}" returned ${count} product(s), first: ${firstTitle}`);
  });

});

