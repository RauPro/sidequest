# Klaviyo account runbook

Use these steps after reviewing the account's existing consent, sender, suppression, and flow settings. Preview all content before activating sends. The application defaults to demo mode; this runbook does not grant permission to send test emails or alter a production account.

## Link tracking and catalog

1. In the Klaviyo account's email/link tracking settings, enable the Klaviyo tracking parameter (`_kx`) on email links. Verify a preview link retains the parameter through redirects to SIDEQUEST. The game captures `_kx` and removes it from the visible URL after handling the deep link.
2. Under **Content → Products → Manage Custom Catalog Sources**, add `https://sidequest.raul.engineer/catalog/klaviyo.json` as the `SIDEQUEST companions` source.
3. Map the standard product fields and the custom `inventory_quantity` → `$inventory_quantity` and `inventory_policy` → `$inventory_policy` fields as documented in [Product pages and Klaviyo catalog](PRODUCT-PAGES.md). Sync and preview the three stable product IDs (`ember`, `moss`, `bolt`).

## Flows and message content

1. **Welcome:** review the existing `SIDEQUEST Welcome` list-triggered flow and its double-opt-in eligibility filter. Import/update the content from `assets/email/sidequest-welcome-content.html`; preview all companion and fallback blocks and all four `?letter=` links. Activate only after consent, sender, footer, and destination checks pass.
2. **Abandoned cart:** create a `SIDEQUEST Abandoned Cart` flow triggered by `Added to Cart`. Add the flow filter **has done `Sidequest Demo Checkout Completed` zero times since starting this flow**, place a one-hour delay before the message, and enable smart sending. Add `assets/email/sidequest-abandoned-cart-content.html` and preview `event.AddedItemProductName`, `event.AddedItemImageURL`, `event.Items`, `item.ProductName`, and `event.CheckoutURL` with real Klaviyo preview events. Confirm trigger, re-entry, suppression, and delay behavior before activation.
3. **Back in stock:** enable the account's native Back in Stock flow for the synced custom catalog and EMAIL channel, including the **Back in stock delay**. If the current editor does not offer that delay when building from scratch, use the standard Back In Stock Flow template; verify it resolves to the account's Klaviyo-native **Subscribed to Back in Stock** metric. Import `assets/email/sidequest-back-in-stock-content.html`; verify `event.ProductName` and `event.ProductID` in the Klaviyo preview before activation. The verified native event has no `URL` field: use the public product route plus its feed ID. Disable Smart Sending for the single requested restock alert, as recommended by Klaviyo.

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

## Local fallback for the presentation

While online, install dependencies and run `npm run demo:build`. This prepares an isolated production build in ignored `.sidequest-demo/`, with Bolt sold out and all four integration modes set to demo. It copies application inputs only, excludes `.env` files and Vercel state, and clears provider credentials. The regular production build and local environment are unchanged. Google Fonts are downloaded during this preparation; the resulting fonts and artwork are served locally.

For the presentation, run `npm run demo:start` and open <http://127.0.0.1:3110>. Keep that terminal running. Set `SIDEQUEST_DEMO_PORT` if the port is occupied. No rebuild or external connection is needed to start the prepared version; keep this checkout and its installed dependencies on the presentation computer. Rebuild after source changes.

In the local version, visit the Oracle, add Ember or Moss to the bag, open the Raven Ledger, ask Finn a question, and submit a demo back-in-stock request for Bolt. Entries must say `simulated`; this does not demonstrate actual email delivery. A failed live request remains `failed`, so changing to this local version is an explicit fallback, not an automatic retry or a fabricated success. Keep the real email recordings available locally as separate evidence.

For a live rehearsal, use the exact authorized `+alias` in both `ORACLE_PROFILE_ALLOWED_EMAILS` and `KLAVIYO_LIVE_ALLOWED_EMAILS`; aliases do not inherit the base address's permission. Confirm double opt-in in that inbox before testing subscriber-only messages. Preserve the one-hour cart delay, capture receipt of each email, and return Bolt to zero stock after the restock demonstration.

## Verified rollout — November 3, 2026

Production is [sidequest.raul.engineer](https://sidequest.raul.engineer), source `a3457a9`, closing deployment `dpl_3QFS5VFjQjsH82fGxg4EoPYNdv1r`. Server integrations, client tracking, Oracle saves, and Camp connections are enabled; newsletter access is public with double opt-in. Customer Agent uses the real API in `preview` mode. Private keys remain Vercel Production secrets. The primary rehearsal address was explicitly added to both invited-operation allowlists, and its Oracle save returned `saved` with Moss/calm/nature verified in Klaviyo.

| Flow | ID / email | Final configuration | Verification |
| --- | --- | --- | --- |
| SIDEQUEST Welcome | `X5C9GD` / `Tnu8cF` | Live; SIDEQUEST Newsletter entry; subscribed email filter; no re-entry | Double opt-in confirmed; automatic personalized Moss email received at 00:26; its tracked link opened the correct village letter and Market product |
| SIDEQUEST Abandoned Cart | `SDtxhN` / `RNGtLY` | Live; Added to Cart; one-hour delay; one-day re-entry; zero Sidequest Demo Checkout Completed since flow start; subscribed email filter; Smart Sending enabled (16 hours) | Real event fields and return-to-bag link verified; corrected template preview delivered; isolated automatic trial queued for 01:58 |
| SIDEQUEST Back in Stock — Alerts | `UKPs6Y` / `YkFd7W` | Live; Klaviyo-native Subscribed to Back in Stock; native stock delay; minimum inventory 1; notify all subscribers; Smart Sending off | New test recipient waited at stock 0, moved to the email step after stock became 100, and received the automatic Bolt email at 00:49; link opened the available product; stock then restored to 0 |

Times above are America/New_York. The unused empty setup flow `X77BVA` was archived. The shared email base is `Vdku3T`; flow messages retain the native unsubscribe and organization footer. Email-to-website tracking is on; both the preview links and the actual delivered Welcome link were checked.

Use separate aliases of the same authorized mailbox for the scenarios. A newsletter Welcome can cause the cart reminder to be skipped by the 16-hour Smart Sending window. The isolated cart profile was opted in without joining the Welcome-triggering list, so the timed trial can keep the production delay and suppression settings intact. A previous back-in-stock request cannot be repeated for the same profile/variant; use a fresh authorized test identity after the flow is live. Do not manufacture a custom event named Subscribed to Back in Stock: the native subscription endpoint is required.

The automatic cart trial is pending delivery verification. A follow-up in the implementation chat is scheduled to check after the 01:58 send time and finish its recording; a preview is not proof of the timed automatic send. If future runs are still waiting or skipped, record the actual outcome rather than changing the flow to claim success.

Local rehearsal captures and MP4 sequences are kept in ignored `artifacts/rehearsal/`, with a private evidence README. Welcome and stock recordings document delivered automatic messages; `cart-preview-verified.mp4` is explicitly a delivered preview. The clips hold actual captures for readability and do not reproduce the real elapsed delay. The fallback was built and started separately: the village signaled `data-ready=true`, the local Camp replied deterministically, and the Ledger marked client events, Camp, and back-in-stock as `simulated`. Local subscription and Oracle endpoints also returned simulation without delivery or saving.
