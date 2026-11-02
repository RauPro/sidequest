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

Open `http://localhost:3000`. `/` contains the village scaffold; `/shop` provides a direct shopping path with the same persisted cart.

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
- A browser-only Phaser scene with four clickable location placeholders and equivalent DOM navigation.
- A three-product demo catalog, starter recommendation rule, bag controls, and simulated checkout.
- Validated `/api/identify`, `/api/events`, and `/api/subscribe` contracts with no-network demo mode and gated live adapters.
- Unit, integration, and browser test coverage for the foundation.

## Implementation boundaries

The map and commerce work can evolve independently of the integration adapters. Live Klaviyo profile, event, and subscription requests are implemented behind `SIDEQUEST_MODE=live`, valid private configuration, and `KLAVIYO_LIVE_ALLOWED_EMAILS` (a comma-separated test-recipient allowlist). Demo remains the default and makes no external requests.

Profile upserts return verified IDs; events and subscriptions report accepted/pending rather than claiming delivery. Subscription preferences are saved before the consent request. No automatic retry occurs after an uncertain subscription outcome. Production release still requires durable abuse controls and account-side verification; the allowlist is a development gate, not authentication.

See [KLAVIYO-INTEGRATION.md](KLAVIYO-INTEGRATION.md) for request contracts, current account setup, verification evidence, and the remaining rollout steps.

Next.js runs development and production builds. There is no Vite application configuration. Vitest uses Vite internally for testing, so Vite can appear in the dependency tree without being the application framework.

See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries, configuration, current API behavior, and the implementation path. Product context lives in [the PRD](SIDEQUEST-PRD.md) and [the zone/integration brief](SIDEQUEST-Zone-Purposes-and-Klaviyo-Setup.md). Reusable agent guidance lives in [the skill catalog](skills/CATALOG.md).
