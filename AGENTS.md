# Agent notes

## Verification
- Run `npm run typecheck`, `npm run lint`, and `npm test` before each commit. Use `npm run test:e2e` (production build + Playwright on Desktop Chrome and Pixel 7, own server on port 3100) as the final gate for UI or game changes.
- `next dev` rewrites `next-env.d.ts` (dev vs. build type paths). Never commit that change.

## Village map (WORLD-01)
- Layout source of truth: `src/game/world/villageMap.ts` (40×25 tile map, 16 logical px per tile, 640×400 world) and `src/game/world/locations.ts` (footprints, entrances, hit areas). `src/game/world/village.test.ts` enforces path connectivity, footprint/hit-area containment, and non-overlap; movement/pathfinding/decor tests protect walkability.
- Village art is procedural canvas-2D pixel art in `src/game/art/`, with fixed RNG seeds, layered ground/foreground textures, y-sorted sprites, painted signboards, and separate glow/vignette effects. Preserve the current art, layout, and responsive camera with `pixelArt: true`.
- `src/features/game/GameShell.tsx` owns the full-screen HUD and accessible location buttons. Keep the shared store layout as a cart provider; shop/product routes supply their own navigation and main element.
- E2E tests wait for `[data-testid="village-map"][data-ready="true"]` before clicking canvas hotspots.

## Tooling
- `node_modules/phaser/types/phaser.d.ts` is ~8 MB; search it with node rather than size-limited grep tools.
- Proxied browser previews cannot carry the `next dev` hot-reload WebSocket (`/_next/hmr` fails), and without it the dev runtime never loads the dynamically imported Phaser chunk, so the map stays on "Loading village…". Preview a production server instead (`npm run build` then `npx next start --port <free port>`), or open `next dev` directly at `http://localhost:3000`.
- Other worktrees (e.g. `../Sidequest-klaviyo`) may run their own dev servers; check which directory owns a port before reusing it.
