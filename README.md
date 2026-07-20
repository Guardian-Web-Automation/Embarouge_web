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

## Cloudflare "Verify you are human" challenge

The live store is behind Cloudflare, which sometimes shows a **"Verify you are
human"** page. This interactive challenge is designed to block automation and
**cannot be reliably clicked or solved from code**. The reliable fix is to tell
Cloudflare our tests are trusted.

**Option A — Allowlist the test IP (simplest for local runs)**
1. Find your public IP: https://whatismyipaddress.com
2. In the store's Cloudflare dashboard → **Security → WAF → Tools → IP Access Rules**
3. Add your IP with action **Allow** (scoped to this site).

**Option B — Bypass header (works in GitHub Actions too, IPs there change)**
1. Pick a long random secret, e.g. `qa-9f3k2m8x...`
2. Cloudflare dashboard → **Security → WAF → Custom rules → Create rule**
   - When incoming requests match: `http.request.headers["x-qa-bypass"] contains "<your-secret>"`
   - Then take action: **Skip** → skip **Managed Challenge** (and other security).
3. Set the same secret as `QA_BYPASS_TOKEN`:
   - Local: put it in `.env`
   - GitHub Actions: repo **Settings → Secrets and variables → Actions** → add secret `QA_BYPASS_TOKEN`

Playwright then sends the `x-qa-bypass` header automatically (see `playwright.config.js`),
and Cloudflare lets the tests through with no challenge.

If neither is set up and a challenge appears, tests fail with a clear message
pointing back to this section (see `utils/cloudflare.js`).

## Notes on locators
- ADD TO BAG is a custom element: `add-to-cart.card--button`.
- The mini-cart renders A/B **control** and **variant** copies of some nodes,
  so headings are scoped to the first match.
- Collection vs cart titles differ in casing and dash style, so the cart
  assertion compares on a normalized form rather than strict equality.
