import { describe, expect, it } from "vitest";
import {
  MAP_COLS, MAP_ROWS, WORLD_HEIGHT, WORLD_WIDTH, isPathKind, plazaCenter, reachableTiles,
  tileAt, tileKey, tileLegend, tileRectToWorld, villageEntry, villageRows, visitorSpawn,
} from "./villageMap";
import { locationIds, locations } from "./locations";
import type { WorldRect } from "./villageMap";

const allTiles = villageRows.flatMap((row, r) => [...row].map((ch, c) => ({ ch, c, r })));
const overlaps = (a: WorldRect, b: WorldRect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const containsRect = (outer: WorldRect, inner: WorldRect) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

describe("village tile map", () => {
  it("is a 40x25 grid using only legend characters", () => {
    expect(villageRows).toHaveLength(MAP_ROWS);
    for (const [r, row] of villageRows.entries()) {
      expect(row, `row ${r}`).toHaveLength(MAP_COLS);
      for (const ch of row) expect(Object.hasOwn(tileLegend, ch), `row ${r} "${ch}"`).toBe(true);
    }
    expect(WORLD_WIDTH).toBe(800);
    expect(WORLD_HEIGHT).toBe(500);
  });

  it("covers every building tile with a non-overlapping footprint", () => {
    for (const location of locations) {
      const { col, row, cols, rows } = location.footprint;
      for (let r = row; r < row + rows; r++) for (let c = col; c < col + cols; c++) expect(tileAt(c, r), `${location.id} ${c},${r}`).toBe("building");
    }
    for (const [i, a] of locations.entries()) for (const b of locations.slice(i + 1)) {
      const f = (r: typeof a.footprint) => ({ x: r.col, y: r.row, width: r.cols, height: r.rows });
      expect(overlaps(f(a.footprint), f(b.footprint)), `${a.id}/${b.id}`).toBe(false);
    }
    const covered = new Set(locations.flatMap(({ footprint: f }) =>
      Array.from({ length: f.cols * f.rows }, (_, i) => tileKey({ col: f.col + (i % f.cols), row: f.row + Math.floor(i / f.cols) }))));
    for (const { ch, c, r } of allTiles) if (ch === "B") expect(covered.has(`${c},${r}`), `${c},${r}`).toBe(true);
  });

  it("places each entrance on a path-kind tile just below its footprint", () => {
    for (const location of locations) {
      const { footprint: f, entrance } = location;
      expect(entrance.row, location.id).toBe(f.row + f.rows);
      expect(entrance.col, location.id).toBeGreaterThanOrEqual(f.col);
      expect(entrance.col, location.id).toBeLessThan(f.col + f.cols);
      expect(isPathKind(tileAt(entrance.col, entrance.row)), location.id).toBe(true);
    }
  });

  it("connects the plaza to every entrance, the village entry and all path tiles", () => {
    const reached = reachableTiles(plazaCenter, isPathKind);
    for (const location of locations) expect(reached.has(tileKey(location.entrance)), location.id).toBe(true);
    expect(reached.has(tileKey(villageEntry))).toBe(true);
    for (const { ch, c, r } of allTiles) if (isPathKind(tileLegend[ch])) expect(reached.has(`${c},${r}`), `${c},${r}`).toBe(true);
  });

  it("isolates Oracle and Camp entrances when bridges are not passable", () => {
    const reached = reachableTiles(plazaCenter, (kind) => isPathKind(kind) && kind !== "bridge");
    const entranceOf = (id: string) => tileKey(locations.find((l) => l.id === id)!.entrance);
    expect(reached.has(entranceOf("oracle"))).toBe(false);
    expect(reached.has(entranceOf("camp"))).toBe(false);
    expect(reached.has(entranceOf("market"))).toBe(true);
    expect(reached.has(entranceOf("post"))).toBe(true);
  });
});

describe("village locations", () => {
  it("keeps hit areas in bounds, covering footprint and label, without overlap", () => {
    const world = { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT };
    for (const location of locations) {
      expect(containsRect(world, location.hitArea), location.id).toBe(true);
      expect(containsRect(location.hitArea, tileRectToWorld(location.footprint)), location.id).toBe(true);
      expect(containsRect(location.hitArea, { ...location.label, width: 1, height: 1 }), location.id).toBe(true);
    }
    for (const [i, a] of locations.entries()) for (const b of locations.slice(i + 1)) {
      expect(overlaps(a.hitArea, b.hitArea), `${a.id}/${b.id}`).toBe(false);
    }
  });

  it("keeps label anchors inside the safe band for DOM overlays", () => {
    for (const { label, id } of locations) {
      expect(label.x, id).toBeGreaterThanOrEqual(120);
      expect(label.x, id).toBeLessThanOrEqual(680);
      expect(label.y, id).toBeGreaterThanOrEqual(30);
      expect(label.y, id).toBeLessThanOrEqual(470);
    }
  });

  it("spawns the visitor on the plaza clear of every hit area", () => {
    expect(tileAt(Math.floor(visitorSpawn.x / 20), Math.floor(visitorSpawn.y / 20))).toBe("plaza");
    for (const { hitArea } of locations) expect(containsRect(hitArea, { ...visitorSpawn, width: 1, height: 1 })).toBe(false);
  });

  it("declares ids in order with unique non-empty names and purposes", () => {
    expect(locations.map((l) => l.id)).toEqual([...locationIds]);
    expect(new Set(locations.map((l) => l.name)).size).toBe(locations.length);
    expect(new Set(locations.map((l) => l.purpose)).size).toBe(locations.length);
    for (const l of locations) {
      expect(l.name.trim()).not.toBe("");
      expect(l.purpose.trim()).not.toBe("");
    }
  });
});
