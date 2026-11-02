# SIDEQUEST

A Next.js App Router foundation for an explorable storefront. React owns the shopping interface, Phaser owns the browser canvas, and Next.js Route Handlers provide the backend boundary.

## Run locally

Use Node.js 24 or a compatible newer release (`.nvmrc` selects 24).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

If `.env.local` already exists, preserve it rather than overwriting your configuration. The initial local file is provided in demo mode and ignored by Git.

Open `http://localhost:3000`. `/` contains the playable village; `/shop` provides a direct shopping path with the same persisted cart.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

For browser tests, install Chromium once and run Playwright. The test script builds the app, then the test configuration starts its own production server on port 3100 in demo mode.

```sh
npx playwright install chromium
npm run test:e2e
```

## What is implemented

- App Router pages and a shared client cart provider with versioned local persistence.
- A full-screen playable Phaser game at `/` rendering Willow Market as original code-drawn 3/4-view pixel art from a tested tile map: layered ground/foreground canvases, y-sorted buildings, props and NPCs, painted signboards, a reference-style HUD and a places menu.
- Player movement (arrow keys/WASD, tap-to-move pathfinding, collision against tiles and decor), E/Space/Enter to enter a place, canvas hotspots, and DOM panels for Market, Oracle, Camp, Post Office and the bag.
- A three-product demo catalog, starter recommendation rule, bag controls, and simulated checkout.
- Companion product pages, public PNG images, and the Klaviyo catalog feed at `/catalog/klaviyo.json`.
- Oracle choices persisted locally, with optional profile saves through the independently gated `/api/oracle/preferences` endpoint.
- Validated `/api/identify`, `/api/events`, and `/api/subscribe` contracts with no-network demo mode and gated live adapters.
- Unit, integration, and browser test coverage for the foundation.

## Implementation boundaries

The map and commerce work can evolve independently of the integration adapters. Live Klaviyo profile, event, and subscription requests are implemented behind `SIDEQUEST_MODE=live`, valid private configuration, and `KLAVIYO_LIVE_ALLOWED_EMAILS` (a comma-separated test-recipient allowlist). Demo remains the default and makes no external requests.

Oracle profile saving uses its own `ORACLE_PROFILE_MODE` and `ORACLE_PROFILE_ALLOWED_EMAILS`, so enabling it does not enable subscriptions or events. See [CUSTOMER-AGENT.md](CUSTOMER-AGENT.md) for the verified Oracle release and [PRODUCT-PAGES.md](PRODUCT-PAGES.md) for the catalog contract. Automatic event dispatch from shopping actions, the shopper-facing chat widget, and environmental animation remain future work.

Profile upserts return verified IDs; events and subscriptions report accepted/pending rather than claiming delivery. Subscription preferences are saved before the consent request. No automatic retry occurs after an uncertain subscription outcome. Production release still requires durable abuse controls and account-side verification; the allowlist is a development gate, not authentication.

See [KLAVIYO-INTEGRATION.md](KLAVIYO-INTEGRATION.md) for request contracts, current account setup, verification evidence, and the remaining rollout steps.

Next.js runs development and production builds. There is no Vite application configuration. Vitest uses Vite internally for testing, so Vite can appear in the dependency tree without being the application framework.

## Release source

`main` is the integration branch for the playable village, product feed, Oracle, and Klaviyo adapters. Release from a verified `main` checkout to the existing Vercel project `paypalrau-9729s-projects/sidequest` at `https://sidequest.raul.engineer`. Updating Git alone does not replace an existing CLI deployment. Preserve the full-screen village shell and the route-specific shop/product layouts when integrating future changes.

See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries, configuration, current API behavior, and the implementation path. Product context lives in [the PRD](SIDEQUEST-PRD.md) and [the zone/integration brief](SIDEQUEST-Zone-Purposes-and-Klaviyo-Setup.md). Reusable agent guidance lives in [the skill catalog](skills/CATALOG.md).
