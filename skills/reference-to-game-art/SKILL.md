---
name: reference-to-game-art
description: Turn a visual reference into usable 2D web-game artwork and map data, including layered scenery, transparent sprites, Aseprite exports, and Tiled interaction or collision authoring. Use when preparing game assets from an illustration or assembling an illustrated world; standalone illustrations do not need this pipeline.
---

# Reference to playable 2D art

Inspect the supplied image before choosing an asset pipeline. A flattened reference communicates composition and style; it does not contain hidden scenery, separate objects, walk cycles, or collision geometry.

## Choose the smallest useful representation

- One fixed village or room: consider layered background artwork, separate actors, foreground occluders, and authored movement data.
- Repeated terrain or multiple editable levels: consider a tileset and tilemap.
- Hotspot-only prototype: retain a background with responsive semantic location controls; do not introduce movement assets until movement is in scope.
- Preserve the supplied projection. Do not force irregular painted perspective onto an isometric grid merely because buildings have angled roofs.

Agree on a logical scene coordinate space, sprite scale, palette, ground-contact anchors, and intended display scale. Distinguish true low-resolution pixel art from high-resolution pixel-styled illustration. Nearest-neighbor scaling cannot make inconsistent source pixels coherent.

## Separate the asset roles

Prepare only the assets required by the current interaction:

- A clean scenery layer with baked-in UI and moving actors removed; reconstruct obscured areas instead of treating removal as lossless extraction.
- Foreground layers for trees, railings, roofs, or other objects that occlude the visitor.
- Character and companion sprites with transparent backgrounds and consistent pose proportions.
- Small animation sequences for effects that materially improve the scene.
- Decorative panel frames/icons separated from readable text and interactive DOM controls.

Use the available image-generation/editing workflow for generated raster edits when appropriate; use an existing pixel editor or asset source for precise authored frames. Follow tool-specific editing instructions. Generation is optional and does not guarantee aligned animation frames. Inspect every exported sequence for jitter, silhouette drift, halos, and missing frames. Preserve original source assets and record provenance/license or generation origin.

Read [sprite-export.md](references/sprite-export.md) for Aseprite/export decisions. Read [tiled-map-authoring.md](references/tiled-map-authoring.md) when creating map coordinates, polygons, tile data, or interaction zones. Neither tool is a mandatory purchase or installation for a simple hotspot scene.

## Validate in the game

Check sprites on both dark and light backgrounds, at native and intended display scales. Verify foot anchors through a full walk cycle and foreground occlusion on both sides of an object. Preview atlas edges under the actual filtering mode. Confirm exported assets load from the production build and deployment base path.

For mobile, adapt the viewport and interface separately. A fixed illustration with all labels and buttons embedded cannot simply be scaled down into a usable phone interface.

## Sources

Consulted 2026-11-02. Tool-specific export options should be checked against the installed version.

- [Aseprite sprite sheets](https://www.aseprite.org/docs/sprite-sheet/)
- [Aseprite command line](https://www.aseprite.org/docs/cli/)
- [Tiled introduction](https://docs.mapeditor.org/en/stable/manual/introduction/)
- [Tiled JSON format](https://docs.mapeditor.org/en/stable/reference/json-map-format/)
