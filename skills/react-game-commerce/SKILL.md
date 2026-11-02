---
name: react-game-commerce
description: Implement React commerce interfaces in Next.js shared with an interactive game world, including a single cart, hydration-safe persistence, deterministic recommendations, accessible dialogs, and simulated checkout. Use for game storefronts or parallel map and shop views; real payment-provider integration requires its own verified provider workflow.
---

# Shared game and commerce state

Read the project's requirements, catalog, and existing state ownership before adding a store. Keep products and domain decisions independent of React components and game scene instances. The game and direct Shop view must invoke the same domain actions.

Use Next.js Client Components for interactive commerce and the shared client provider. Server Components can supply intended catalog data, and Route Handlers host trusted integration operations. Keep provider credentials and server adapters out of modules imported by the client store.

## State boundaries

- Maintain one catalog keyed by stable product IDs. Store cart quantities by ID and derive prices, line totals, and counts. Specify whether the displayed count means total units or distinct products.
- Represent money in integer minor units with explicit currency metadata; do not assume every currency has two decimal places. Bound quantities and arithmetic, reject invalid values, and use locale-aware formatting at the view boundary.
- Use the project's existing state library if suitable. A small external TypeScript store can be sufficient; a library is not required solely because a game is embedded.
- If subscribing to an external store from React, use its supported binding or `useSyncExternalStore`. Keep `subscribe` stable and return cached immutable snapshots until data changes. Avoid creating a fresh object on every snapshot read.
- For Next.js prerendering, provide a compatible `getServerSnapshot` where needed and keep initial server/client output consistent. Scope each visitor's mutable state to its provider/request; never share a server module singleton cart between requests. Place the provider above routes that need to retain the cart during client navigation.
- Keep player movement and transient animation outside the commerce store. Publish intentional shopping actions, not simulation ticks.

Use Context7 when available to resolve React and verify the relevant state/lifecycle API for the installed version. Consult [React external-store documentation](https://react.dev/reference/react/useSyncExternalStore) if the connector is unavailable.

## Persistence and deterministic decisions

Read [state-and-checkout.md](references/state-and-checkout.md) when implementing hydration, cart commands, recommendations, or checkout.

Persist only necessary local data, with a schema version. Treat restored JSON as untrusted: validate shape, product IDs, quantities, and supported versions. Keep an in-memory fallback when storage is blocked or full. Read browser storage after client mounting, then enable persistence so an empty initial render cannot overwrite a saved cart. Derive current prices from the catalog; client persistence is never authoritative for real purchases.

Recommendations should be a pure mapping from supported answers to product IDs with an explicit tie-break rule. Generate explanations from the answers used. Keep recommendation state separate from marketing consent and permit a visitor to choose another product.

## Accessible DOM interface

- Render essential controls, text, and forms in semantic HTML even when the village is canvas-based. Expose every commerce destination through direct navigation.
- Use an accessible dialog primitive or implement the WAI pattern: label, initial focus, modal focus containment, Escape where appropriate, and focus restoration. If the opener was a canvas location, restore focus to a stable corresponding DOM control.
- Opening a panel must release game keyboard capture and stop held movement. Closing it must not unexpectedly activate a canvas click beneath it.
- Announce important cart/status changes without announcing continuous movement. Associate validation with fields and retain entered values after recoverable errors.
- On mobile, reflow panels and keep actions reachable. Reduced motion should preserve task completion and readable feedback.

## Integration boundary

Demo checkout has an explicit simulated confirmation and collects no payment data. Live commerce needs a trusted backend and provider-confirmed success. Emit semantic domain events once per completed action, outside React render/effect synchronization. An integration failure should not corrupt the local shopping state.

Sources consulted 2026-11-02: [React external stores](https://react.dev/reference/react/useSyncExternalStore), [Next.js component boundaries](https://nextjs.org/docs/app/getting-started/server-and-client-components), [WAI modal dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), and [Vercel React guidance on skills.sh](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices). The skills.sh entry informed performance review scope; this original skill now targets the Next.js application stack without requiring that third-party skill package.
