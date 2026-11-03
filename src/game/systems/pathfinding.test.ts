import { describe, expect, it } from "vitest";
import { locations } from "../world/locations";
import { TILE_SIZE, isWalkableKind, tileAt, visitorSpawn } from "../world/villageMap";
import { findPath, nearestReachable, tileWalkable } from "./pathfinding";

const walkable = (c: number, r: number) => tileWalkable(c, r);
const spawn = {
  col: Math.floor(visitorSpawn.x / TILE_SIZE),
  row: Math.floor(visitorSpawn.y / TILE_SIZE),
};

describe("pathfinding", () => {
  it("finds corner-safe walkable paths from the spawn to every entrance", () => {
    for (const l of locations) {
      const path = findPath(spawn, l.entrance, walkable);
      expect(path, l.id).not.toBeNull();
      expect(path!.at(-1)).toEqual(l.entrance);
      for (const [i, t] of path!.entries()) {
        expect(walkable(t.col, t.row), `${l.id} ${t.col},${t.row}`).toBe(true);
        if (i === 0) continue;
        const prev = path![i - 1];
        const dc = t.col - prev.col, dr = t.row - prev.row;
        if (dc !== 0 && dr !== 0) {
          expect(walkable(prev.col + dc, prev.row) && walkable(prev.col, prev.row + dr), `${l.id} corner at ${prev.col},${prev.row}`).toBe(true);
        }
      }
    }
  });
  it("snaps a blocked target to the nearest reachable walk tile", () => {
    const blocked = { col: 0, row: 0 };
    expect(isWalkableKind(tileAt(blocked.col, blocked.row))).toBe(false);
    const snapped = nearestReachable(spawn, blocked, walkable);
    expect(snapped).not.toBeNull();
    expect(walkable(snapped!.col, snapped!.row)).toBe(true);
    expect(findPath(spawn, snapped!, walkable)).not.toBeNull();
  });
  it("is deterministic", () => {
    expect(findPath(spawn, locations[0].entrance, walkable)).toEqual(findPath(spawn, locations[0].entrance, walkable));
    expect(nearestReachable(spawn, { col: 0, row: 0 }, walkable)).toEqual(nearestReachable(spawn, { col: 0, row: 0 }, walkable));
  });
});
