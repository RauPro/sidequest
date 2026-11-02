# Tiled maps for illustrated worlds

For a fixed painted scene, Tiled can place the background as an image layer and annotate it with object layers. A tile grid is optional. Use the same logical world dimensions as the runtime and document any artwork-to-world scale.

Suggested application roles are background, foreground, spawn points, obstacles, walkable regions, and interaction zones. These names are conventions to adapt, not built-in engine behavior. Give interactive destinations stable IDs and typed properties consumed by an explicit importer. A visible sign and its interaction region need not have identical bounds.

## Coordinate and import checks

- Inspect layer/group offsets, object rotation, and the image scale. Polygon points are relative to their object origin; transform them into the coordinate system used by movement.
- Do not assume tile objects and rectangle objects use the same origin. Confirm alignment for the chosen map orientation and loader.
- Prefer the engine's supported Tiled loader when using tilemaps. For a custom importer, explicitly support or reject map orientation, encoded data, infinite-map chunks, external tilesets, global tile IDs, and flip flags; do not silently render an unsupported map incorrectly.
- Export only features understood by the selected runtime version. Tiled's latest JSON format can contain fields an older engine does not implement.

## Walkability is separate from artwork

Author blocked and traversable regions deliberately. The character's ground footprint must fit through a route, not just its center point. Expand obstacles or account for the movement body's size when planning paths. Snap an unreachable tap to a defined reachable destination or explain that it cannot be reached.

Bridges require connectivity across the intended banks and collision boundaries along their edges. If a player can also pass beneath a bridge, encode separate movement/elevation states rather than relying on one overlapping 2D polygon. Depth ordering alone does not define traversability.

## Verification

Render a development overlay for anchors, collision boundaries, interaction IDs, and the planned path. Walk each route and test its narrowest passage and edges. Verify pointer hits after camera zoom, page scrolling, and responsive resizing. Keep debug visualization out of the normal player flow.

Sources: [Tiled introduction](https://docs.mapeditor.org/en/stable/manual/introduction/), [JSON map format](https://docs.mapeditor.org/en/stable/reference/json-map-format/). Navigation and bridge modeling are application design guidance; Tiled exports data rather than implementing a movement system.
