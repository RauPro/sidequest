# Browser engine boundary and hydration

Keep the browser engine import behind a small Client Component wrapper. This illustrative pattern assumes `PhaserHost` is a default-exported component that creates and disposes its game correctly:

```tsx
'use client'

import dynamic from 'next/dynamic'

const PhaserHost = dynamic(() => import('./PhaserHost'), {
  ssr: false,
  loading: () => <p role="status">Loading village…</p>,
})

export default function Village() {
  return <PhaserHost />
}
```

The path and component name are application examples. Keep `ssr: false` inside a Client Component. Do not import Phaser at runtime through a Server Component, shared barrel, catalog module, or the outer wrapper. Type-only imports are different from runtime imports. Reserve space for the loading state and retain accessible navigation when the engine cannot load.

## State ownership

Client Components can participate in server prerendering. Do not access `window`, `document`, or `localStorage` during server-evaluated initialization. Give server rendering and the first client render the same deterministic snapshot; restore browser storage after mounting, then enable persistence. If using `useSyncExternalStore` with prerendering, supply a compatible stable `getServerSnapshot` as well as a cached client snapshot.

Create user-specific store state per provider/application instance rather than in a mutable server module singleton. A server singleton can leak one visitor's cart into another request. Keep its initial data serializable and intentionally passed across the server/client boundary.

Choose the provider's placement based on navigation. If `/world` and `/shop` are separate routes, place their shared client provider in a persistent common layout. A provider in a remounting page or template can reset the cart on navigation. If both are panels on one page, a provider above the panels is sufficient. Do not hold disposable Phaser objects in that long-lived store.

## Lifecycle and assets

The game host must survive unrelated React rerenders and clean up on unmount, scene restart, development StrictMode, and hot reload. Guard late dynamic initialization against an already-unmounted host. Test returning to a game route after visiting Shop view; the scene should rehydrate application state rather than depend on old event delivery.

Serve Phaser textures and map JSON as ordinary assets, commonly from `public/game/`. A file at `public/game/player.png` is requested as `/game/player.png`, adjusted explicitly for any configured base path/CDN. The canvas loader needs a real URL, not a `next/image` component or an unexamined static-import metadata object. Ensure nested atlas/tileset image references resolve against the chosen asset base.

Sources: [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading), [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [public assets](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder), [React external-store snapshots](https://react.dev/reference/react/useSyncExternalStore). Store placement and engine lifecycle are application architecture guidance.
