# Klaviyo account runbook

Use these steps after reviewing the account's existing consent, sender, suppression, and flow settings. Preview all content before activating sends. The application defaults to demo mode; this runbook does not grant permission to send test emails or alter a production account.

## Link tracking and catalog

1. In the Klaviyo account's email/link tracking settings, enable the Klaviyo tracking parameter (`_kx`) on email links. Verify a preview link retains the parameter through redirects to SIDEQUEST. The game captures `_kx` and removes it from the visible URL after handling the deep link.
2. Under **Content → Products → Manage Custom Catalog Sources**, add `https://sidequest.raul.engineer/catalog/klaviyo.json` as the `SIDEQUEST companions` source.
3. Map the standard product fields and the custom `inventory_quantity` → `$inventory_quantity` and `inventory_policy` → `$inventory_policy` fields as documented in [Product pages and Klaviyo catalog](PRODUCT-PAGES.md). Sync and preview the three stable product IDs (`ember`, `moss`, `bolt`).

## Flows and message content

1. **Welcome:** review the existing `SIDEQUEST Welcome` list-triggered flow and its double-opt-in eligibility filter. Import/update the content from `assets/email/sidequest-welcome-content.html`; preview all companion and fallback blocks and all four `?letter=` links. Activate only after consent, sender, footer, and destination checks pass.
2. **Abandoned cart:** create a `SIDEQUEST Abandoned Cart` flow using the `Started Checkout` / `Added to Cart` event data. Add `assets/email/sidequest-abandoned-cart-content.html` and preview `event.AddedItemProductName`, `event.AddedItemImageURL`, `event.Items`, `item.ProductName`, and `event.CheckoutURL` with real Klaviyo preview events. Confirm trigger, re-entry, suppression, and delay behavior before activation.
3. **Back in stock:** enable the account's Back in Stock flow for the synced custom catalog and EMAIL channel. Import `assets/email/sidequest-back-in-stock-content.html`; verify `event.ProductName` and `event.URL` in the Klaviyo preview before activation (the template includes a verification comment for these variables).

## Vercel configuration and redeploy

Set these **Production** environment variables in the existing Vercel project:

```text
NEXT_PUBLIC_KLAVIYO_SITE_ID=<public Klaviyo site ID>
NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING=live
NEXT_PUBLIC_SIDEQUEST_SOLD_OUT=bolt
```

`NEXT_PUBLIC_KLAVIYO_SITE_ID` is public and is not a private API key. Never place the private Klaviyo key in a `NEXT_PUBLIC_` variable or browser code. Keep server credentials in their existing encrypted server-only variables. `NEXT_PUBLIC_SIDEQUEST_SOLD_OUT=bolt` is a showcase setting; use an empty value when all demo companions should appear available. Save the settings and redeploy so Next.js rebuilds the public configuration.

## Demo script

1. Start in demo mode and open `/?letter=ember`; wait for the village readiness indicator, read Milo's letter, and choose **Visit Ember at the Market**. Confirm the `letter` parameter is removed.
2. Visit the Oracle, add a recommendation to the shared bag, then open the Raven Ledger with **L**. Inspect simulated product/cart/letter events.
3. Open `/products/bolt` or the Market in a build with `NEXT_PUBLIC_SIDEQUEST_SOLD_OUT=bolt`. Confirm Add to bag is disabled and the raven form is visible.
4. Submit a test address only against the demo build to see the simulated result. Do not switch to live mode or submit a live Back in Stock request unless account-side consequences are explicitly authorized.
5. For account setup validation, use Klaviyo's template and flow previews. A 202 response in the browser means Klaviyo accepted a request; it does not prove a flow ran or an email was delivered.
