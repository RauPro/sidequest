# Sprite preparation and export

Create an asset inventory with stable IDs, role, source path, runtime path, dimensions, ground-contact anchor, and intended animation names. Add frame duration and source/license notes where relevant. Do not introduce an elaborate manifest format if the project already has one.

## Geometry and animation

Use a consistent frame canvas and foot position across directional frames. Keep collision geometry independent of the visible outline: horns, wings, or a hat generally should not enlarge the visitor's ground footprint. Choose the minimum directions and frames the requested movement needs. A static product portrait is not automatically a walkable companion sprite.

Keep idle/walk/effect sequences named consistently. Inspect frame timing and transitions rather than assuming uniform frame rates. Retain alpha transparency; a checkerboard drawn into an image is not transparency.

## Aseprite

Detect the installed executable and check its help/version before constructing commands. Batch export supports a PNG sheet and JSON metadata; use a metadata format supported by the actual runtime loader. Frame tags can identify animation ranges. Preserve editable `.aseprite` sources separately from runtime exports.

A fixed grid can omit trimming for predictable alignment. Packed or trimmed atlases require the loader to honor original size and offsets; otherwise animation feet will jump. Check frame rectangles are inside the image and frame/tag references resolve. Check padding/extrusion with the runtime filter mode to avoid neighboring sprites bleeding at edges.

Avoid destructive resampling of the reference. If it contains inconsistent pixel scale, decide whether to redraw at a chosen grid or retain it as high-resolution illustration. Optimize runtime copies only after visual inspection; keep an original for future edits.

Source: [Aseprite CLI](https://www.aseprite.org/docs/cli/), [sprite-sheet concepts](https://www.aseprite.org/docs/sprite-sheet/). Recommendations about foot anchors, runtime loader compatibility, and asset inventory are pipeline design choices, not exporter guarantees.
