# Agent notes

## Verification
- Run `npm run typecheck`, `npm run lint`, and `npm test` before each commit. Use `npm run test:e2e` (production build + Playwright on Desktop Chrome and Pixel 7, own server on port 3100) as the final gate for UI or game changes.
- `next dev` rewrites `next-env.d.ts` (dev vs. build type paths). Never commit that change.

## Village map (WORLD-01)
- Layout source of truth: `src/game/world/villageMap.ts` (40×25 tile map, 20 logical px per tile, 800×500 world) and `src/game/world/locations.ts` (footprints, entrances, hit areas, label anchors). `src/game/world/village.test.ts` enforces path connectivity, footprint/hit-area containment, non-overlap, and the label safe band (x 120–680, y 30–470).
- Village art is procedural canvas-2D pixel art in `src/game/art/`, painted at 400×250 and scaled ×2 with `pixelArt: true`: integer `fillRect` only, fixed RNG seed, no text on the canvas.
- Signpost labels are aria-hidden DOM overlays in `src/features/world/WorldClient.tsx`; the location nav buttons are the accessible equivalent.
- E2E tests wait for `[data-testid="village-map"][data-ready="true"]` before clicking canvas hotspots.

## Tooling
- `node_modules/phaser/types/phaser.d.ts` is ~8 MB; search it with node rather than size-limited grep tools.
- Proxied browser previews cannot carry the `next dev` hot-reload WebSocket (`/_next/hmr` fails), and without it the dev runtime never loads the dynamically imported Phaser chunk, so the map stays on "Loading village…". Preview a production server instead (`npm run build` then `npx next start --port <free port>`), or open `next dev` directly at `http://localhost:3000`.
- Other worktrees (e.g. `../Sidequest-klaviyo`) may run their own dev servers; check which directory owns a port before reusing it.
