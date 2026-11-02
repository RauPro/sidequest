# Agent notes

## Verification
- Run `npm run typecheck`, `npm run lint`, and `npm test` before each commit. Use `npm run test:e2e` (production build + Playwright on Desktop Chrome and Pixel 7, own server on port 3100) as the final gate for UI or game changes.
- `next dev` rewrites `next-env.d.ts` (dev vs. build type paths). Never commit that change.

## Village map (WORLD-01)
- Layout source of truth: `src/game/world/villageMap.ts` (currently a 40×25 tile map, 16 logical px per tile, 640×400 world; grid size, tile size and world size may change) and `src/game/world/locations.ts` (footprints, entrances, hit areas). `src/game/world/village.test.ts` enforces path connectivity, footprint/hit-area containment, and non-overlap; movement/pathfinding/decor tests protect walkability.
- Current village art is procedural canvas-2D pixel art in `src/game/art/` (fixed RNG seeds, layered ground/foreground textures, y-sorted sprites, painted signboards, glow/vignette effects). It is a starting point, not a constraint.
- `src/features/game/GameShell.tsx` owns the full-screen HUD and accessible location buttons. Keep the shared store layout as a cart provider; shop/product routes supply their own navigation and main element.
- E2E tests wait for `[data-testid="village-map"][data-ready="true"]` before clicking canvas hotspots.

## Visual target
- `ui-concepts/sidequest.png` is the visual target for the village and HUD. Aim to match it as closely as possible: composition, 3/4 perspective with terraces and cliffs, river/waterfalls/bridges, building and prop detail, lighting, characters, and the HUD (quest card, dialogue box with portrait and choices, product side panel, controls bar).
- Any art pipeline is allowed: higher-resolution or larger tile maps, layered raster backgrounds/foregrounds, sprite sheets and atlases under `public/game/`, generated or hand-edited images (keep editable sources and provenance in `assets/source/`), or improved procedural art. Rewrite the map, art, camera and HUD as needed; update the related tests to the new layout rather than bending the art to the old ones.
- Keep these behaviours: walkable paths and collision, keyboard and tap-to-move, canvas hotspots and the accessible location buttons, DOM panels for commerce and forms, `pixelArt` filtering for pixel art, and the `data-ready` signal used by E2E tests.
- Compare a production render against the reference at 1586×992 before calling visual work done.

## Tooling
- `node_modules/phaser/types/phaser.d.ts` is ~8 MB; search it with node rather than size-limited grep tools.
- Proxied browser previews cannot carry the `next dev` hot-reload WebSocket (`/_next/hmr` fails), and without it the dev runtime never loads the dynamically imported Phaser chunk, so the map stays on "Loading village…". Preview a production server instead (`npm run build` then `npx next start --port <free port>`), or open `next dev` directly at `http://localhost:3000`.
- Other worktrees (e.g. `../Sidequest-klaviyo`) may run their own dev servers; check which directory owns a port before reusing it.
