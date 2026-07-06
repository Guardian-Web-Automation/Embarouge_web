# Embarouge Automation

Playwright (JavaScript) UI automation for **embarouge.in**, run in **mobile view**
and structured with the **Page Object Model (POM)**.

## Stack
- [Playwright Test](https://playwright.dev) — runner + assertions
- Mobile emulation: iPhone 14 Pro Max (430 × 932)
- ES modules (`"type": "module"`)

## Setup
```bash
npm install
npx playwright install chromium
```

## Run
```bash
npm test            # all tests
npm run test:smoke  # only @smoke tagged tests
npm run test:headed # watch it run in a browser
npm run report      # open the last HTML report
```

## Project structure
```
pages/                 Page Objects
  BasePage.js          shared navigation helper
  CollectionPage.js    Shop All grid + ADD TO BAG
  CartDrawer.js        "YOUR BAG" mini-cart drawer
tests/
  smoke.collection-add-to-cart.spec.js
utils/
  urls.js              paths relative to baseURL
playwright.config.js   mobile project + baseURL
```

## Smoke flow covered
**Collection Page → Click ADD TO BAG**

| | |
|---|---|
| Test case | Verify a basic user can complete the add-to-cart flow |
| Steps | Open Shop All, click ADD TO BAG on a product |
| Expected | Cart drawer opens with the added product, checkout reachable |

## Notes on locators
- ADD TO BAG is a custom element: `add-to-cart.card--button`.
- The mini-cart renders A/B **control** and **variant** copies of some nodes,
  so headings are scoped to the first match.
- Collection vs cart titles differ in casing and dash style, so the cart
  assertion compares on a normalized form rather than strict equality.
