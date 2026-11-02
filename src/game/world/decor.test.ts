import { describe, expect, it } from "vitest";
import { decorObstacles } from "./decor";
import { isWalkableKind, MAP_COLS, MAP_ROWS, TILE_SIZE, tileAt, tileRectToWorld, visitorSpawn } from "./villageMap";
import { locations } from "./locations";

const overlaps = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("village decor obstacles", () => {
  it("never overlap an entrance, bridge or stairs tile", () => {
    const guarded = new Set<string>();
    for (const l of locations) guarded.add(`${l.entrance.col},${l.entrance.row}`);
    for (let r = 0; r < MAP_ROWS; r++) for (let c = 0; c < MAP_COLS; c++) {
      const k = tileAt(c, r);
      if (k === "bridge" || k === "stairs") guarded.add(`${c},${r}`);
    }
    for (const key of guarded) {
      const [col, row] = key.split(",").map(Number);
      const tile = tileRectToWorld({ col, row, cols: 1, rows: 1 });
      for (const o of decorObstacles()) expect(overlaps(o, tile), `${key}`).toBe(false);
    }
  });
  it("keeps every entrance reachable when obstacle-covered tiles count as blocked", () => {
    const obstacles = decorObstacles();
    const walkable = (c: number, r: number) => {
      const central = { x: c * TILE_SIZE + TILE_SIZE / 4, y: r * TILE_SIZE + TILE_SIZE / 4, width: TILE_SIZE / 2, height: TILE_SIZE / 2 };
      return isWalkableKind(tileAt(c, r)) && !obstacles.some((o) => overlaps(o, central));
    };
    const spawn = { col: Math.floor(visitorSpawn.x / TILE_SIZE), row: Math.floor(visitorSpawn.y / TILE_SIZE) };
    const reached = new Set([`${spawn.col},${spawn.row}`]);
    const queue = [spawn];
    while (queue.length) {
      const { col, row } = queue.shift()!;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${col + dc},${row + dr}`;
        if (!reached.has(k) && walkable(col + dc, row + dr)) { reached.add(k); queue.push({ col: col + dc, row: row + dr }); }
      }
    }
    for (const l of locations) expect(reached.has(`${l.entrance.col},${l.entrance.row}`), l.id).toBe(true);
  });
});
