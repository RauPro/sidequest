import { describe, expect, it } from "vitest";
import { TILE_SIZE, isWalkableKind, tileAt } from "../world/villageMap";
import { footRect, isBlocked, stepMovement } from "./movement";

const spawn = { x: 590, y: 480 };
const run = (dir: { x: number; y: number }, seconds: number) => {
  let p = spawn;
  for (let i = 0; i < seconds * 60; i++) p = stepMovement(p, dir, 1000 / 60);
  return p;
};

describe("stepMovement", () => {
  it("gives the diagonal step the same length as a straight step", () => {
    const straight = stepMovement(spawn, { x: 1, y: 0 }, 100);
    const diagonal = stepMovement(spawn, { x: 1, y: 1 }, 100);
    expect(Math.hypot(diagonal.x - spawn.x, diagonal.y - spawn.y)).toBeCloseTo(straight.x - spawn.x, 5);
  });
  it("blocks polygon-masked tiles and movement outside the world", () => {
    expect(isBlocked(footRect({ x: 16, y: 16 }))).toBe(true);
    expect(isBlocked(footRect({ x: 656, y: 368 }))).toBe(true);
    expect(isBlocked(footRect({ x: 1168, y: 816 }))).toBe(true);
    expect(isBlocked({ x: -1, y: 0, width: 2, height: 2 })).toBe(true);
    expect(isBlocked(footRect(spawn))).toBe(false);
  });
  it("slides along a blocked polygon boundary when one axis remains walkable", () => {
    const plazaEdge = { x: 24 * TILE_SIZE + 24, y: 14 * TILE_SIZE + 16 };
    const p = stepMovement(plazaEdge, { x: 1, y: -1 }, 100);
    expect(p.x).toBe(plazaEdge.x);
    expect(p.y).toBeLessThan(plazaEdge.y);
    expect(isWalkableKind(tileAt(Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE)))).toBe(true);
  });
  it("stops at the edge of the plaza walk polygon", () => {
    const p = run({ x: 1, y: 0 }, 3);
    expect(isWalkableKind(tileAt(Math.floor(p.x / TILE_SIZE), Math.floor((p.y - 1) / TILE_SIZE)))).toBe(true);
    expect(p.x).toBeLessThan(832);
  });
});
