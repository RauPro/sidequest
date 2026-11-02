# Local product pages

The three companion routes are available locally after starting the application with `npm run dev`:

- <http://localhost:3000/products/ember>
- <http://localhost:3000/products/moss>
- <http://localhost:3000/products/bolt>

Use the port printed by Next.js if 3000 is already occupied. These are local development URLs, not public URLs for email recipients or Klaviyo's catalog.

Pages are prerendered from the existing catalog IDs. Names, demo prices, availability, and add-to-bag behavior use the same catalog/cart as the village and Shop view. Character copy and original inline pixel illustrations live under `src/features/products/`. The concept illustrations are not published product photographs or email-ready image URLs.

Each page has a distinct title and description, a clear simulated-purchase notice, links to the other companions, and an add-to-bag action with feedback. Unknown product IDs return 404. The product grid links to these routes from both Shop view and the Market panel.

No deployment, domain configuration, or Klaviyo catalog mutation is included. After selecting a public domain, the same route paths can be used beneath it. Before catalog synchronization, supply public raster image URLs and verify all product links without authentication.

## Verification

The production build prerenders all three product pages. Type checking, lint, and 50 unit tests passed. All 10 product-page Playwright checks passed across desktop and mobile, covering direct access, metadata, responsive layout, cart continuity/reload, and unknown-product 404s. The full suite also ran the map tests under active development: four of those checks failed during this run. Those map files are outside this change.
