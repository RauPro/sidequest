import walkGridFixture from "../../../assets/source/village/walk-grid.json";
import { describe, expect, it } from "vitest";
import { locationIds, locations, villageMapDescription } from "./locations";
import {
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  isWalkableKind,
  nearestWalkableTile,
  reachableTiles,
  tileAt,
  tileKey,
  tileRectToWorld,
  villageRows,
  visitorSpawn,
} from "./villageMap";
import { locationHotspots } from "./walkAreas";
import type { WorldRect } from "./villageMap";

const overlaps = (a: WorldRect, b: WorldRect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const containsRect = (outer: WorldRect, inner: WorldRect) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

describe("village tile map", () => {
  it("uses a 48×32 grid of 32px tiles for the 1536×1024 plate", () => {
    expect(TILE_SIZE).toBe(32);
    expect(MAP_COLS).toBe(48);
    expect(MAP_ROWS).toBe(32);
    expect(WORLD_WIDTH).toBe(1536);
    expect(WORLD_HEIGHT).toBe(1024);
    expect(villageRows).toHaveLength(MAP_ROWS);
    for (const row of villageRows) expect(row).toHaveLength(MAP_COLS);
  });

  it("reproduces the supplied tile-center walk-grid fixture exactly", () => {
    expect(villageRows).toEqual(walkGridFixture);
  });

  it("keeps the spawn and all hotspot entrances on connected walkable tiles", () => {
    const spawn = { col: Math.floor(visitorSpawn.x / TILE_SIZE), row: Math.floor(visitorSpawn.y / TILE_SIZE) };
    expect(visitorSpawn).toEqual({ x: 590, y: 480 });
    expect(isWalkableKind(tileAt(spawn.col, spawn.row))).toBe(true);
    const reached = reachableTiles(spawn, isWalkableKind);
    for (const location of locations) {
      const sourceEntrance = locationHotspots[location.id].entrance;
      const containingTile = {
        col: Math.floor(sourceEntrance[0] / TILE_SIZE),
        row: Math.floor(sourceEntrance[1] / TILE_SIZE),
      };
      const expected = isWalkableKind(tileAt(containingTile.col, containingTile.row))
        ? containingTile
        : nearestWalkableTile({ x: sourceEntrance[0], y: sourceEntrance[1] });
      expect(location.entrance, location.id).toEqual(expected);
      expect(isWalkableKind(tileAt(expected.col, expected.row)), location.id).toBe(true);
      expect(reached.has(tileKey(location.entrance)), location.id).toBe(true);
    }
  });
});

describe("village locations", () => {
  it("derives in-bounds, non-overlapping footprints and hit areas from the source hotspots", () => {
    const world = { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT };
    for (const location of locations) {
      const [left, top, right, bottom] = locationHotspots[location.id].rect;
      const footprint = tileRectToWorld(location.footprint);
      expect(containsRect(world, location.hitArea), location.id).toBe(true);
      expect(containsRect(world, footprint), `${location.id} footprint`).toBe(true);
      expect(location.hitArea).toEqual({ x: left, y: top, width: right - left, height: bottom - top });
      expect(containsRect(footprint, location.hitArea), location.id).toBe(true);
    }
    for (const [i, a] of locations.entries()) {
      for (const b of locations.slice(i + 1)) {
        expect(overlaps(a.hitArea, b.hitArea), `hit areas ${a.id}/${b.id}`).toBe(false);
        expect(overlaps(tileRectToWorld(a.footprint), tileRectToWorld(b.footprint)), `footprints ${a.id}/${b.id}`).toBe(false);
      }
    }
  });

  it("keeps the semantic destinations in order and describes their purpose", () => {
    expect(locations.map((location) => location.id)).toEqual([...locationIds]);
    expect(new Set(locations.map((location) => location.name)).size).toBe(locations.length);
    expect(new Set(locations.map((location) => location.purpose)).size).toBe(locations.length);
    for (const location of locations) {
      expect(location.name.trim()).not.toBe("");
      expect(location.purpose.trim()).not.toBe("");
      expect(villageMapDescription).toContain(location.name);
      expect(villageMapDescription).toContain(location.purpose.toLowerCase());
      expect(villageMapDescription).toContain(location.directions);
    }
  });
});
