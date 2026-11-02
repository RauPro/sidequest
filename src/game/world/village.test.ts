import { describe, expect, it } from "vitest";
import {
  MAP_COLS, MAP_ROWS, WORLD_HEIGHT, WORLD_WIDTH, isPathKind, isWalkableKind, plazaCenter,
  reachableTiles, tileAt, tileKey, tileLegend, tileRectToWorld, villageProps, villageRows, visitorSpawn,
} from "./villageMap";
import { locationIds, locations, villageMapDescription } from "./locations";
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
    expect(WORLD_WIDTH).toBe(640);
    expect(WORLD_HEIGHT).toBe(400);
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

  it("maps every prop one-to-one onto a prop tile", () => {
    const propTiles = allTiles.filter(({ ch }) => ch === "x").map(({ c, r }) => `${c},${r}`);
    expect(propTiles.sort()).toEqual(villageProps.map((p) => `${p.col},${p.row}`).sort());
    expect(new Set(villageProps.map((p) => p.id)).size).toBe(villageProps.length);
  });

  it("places each entrance on a path-kind tile beside its footprint or its props", () => {
    for (const location of locations) {
      const { footprint: f, entrance, id } = location;
      expect(isPathKind(tileAt(entrance.col, entrance.row)), id).toBe(true);
      const inFootprint = (c: number, r: number) => c >= f.col && c < f.col + f.cols && r >= f.row && r < f.row + f.rows;
      const ownProps = villageProps.filter((p) => p.location === id);
      const adjacent = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) =>
        inFootprint(entrance.col + dc, entrance.row + dr) ||
        ownProps.some((p) => p.col === entrance.col + dc && p.row === entrance.row + dr));
      expect(adjacent, id).toBe(true);
    }
  });

  it("connects the plaza to every entrance, the south road and all path tiles", () => {
    const reached = reachableTiles(plazaCenter, isPathKind);
    for (const location of locations) expect(reached.has(tileKey(location.entrance)), location.id).toBe(true);
    for (const c of [13, 14, 15]) expect(reached.has(`${c},${MAP_ROWS - 1}`), `south road ${c}`).toBe(true);
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
  it("keeps hit areas in bounds, covering footprint and own props, without overlap", () => {
    const world = { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT };
    for (const location of locations) {
      expect(containsRect(world, location.hitArea), location.id).toBe(true);
      expect(containsRect(location.hitArea, tileRectToWorld(location.footprint)), location.id).toBe(true);
      for (const prop of villageProps.filter((p) => p.location === location.id)) {
        expect(containsRect(location.hitArea, tileRectToWorld({ col: prop.col, row: prop.row, cols: 1, rows: 1 })), prop.id).toBe(true);
      }
    }
    for (const [i, a] of locations.entries()) for (const b of locations.slice(i + 1)) {
      expect(overlaps(a.hitArea, b.hitArea), `${a.id}/${b.id}`).toBe(false);
    }
  });

  it("spawns the visitor on walkable plaza clear of hit areas, reaching all entrances", () => {
    const spawnTile = { col: Math.floor(visitorSpawn.x / 16), row: Math.floor(visitorSpawn.y / 16) };
    expect(tileAt(spawnTile.col, spawnTile.row)).toBe("plaza");
    for (const { hitArea } of locations) expect(containsRect(hitArea, { ...visitorSpawn, width: 1, height: 1 })).toBe(false);
    const reached = reachableTiles(spawnTile, isWalkableKind);
    for (const location of locations) expect(reached.has(tileKey(location.entrance)), location.id).toBe(true);
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

  it("describes every destination in the map's aria-label text", () => {
    for (const l of locations) {
      expect(villageMapDescription, l.id).toContain(l.name);
      expect(villageMapDescription, l.id).toContain(l.purpose.toLowerCase());
      expect(villageMapDescription, l.id).toContain(l.directions);
    }
  });
});
