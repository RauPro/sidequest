import { describe, expect, it } from "vitest";
import { decorObstacles } from "../world/decor";
import { footRect, isBlocked, stepMovement } from "./movement";

const spawn = { x: 296, y: 190 };
const run = (dir: { x: number; y: number }, seconds: number) => {
  let p = spawn;
  for (let i = 0; i < seconds * 60; i++) p = stepMovement(p, dir, 1000 / 60, []);
  return p;
};

describe("stepMovement", () => {
  it("gives the diagonal step the same length as a straight step", () => {
    const straight = stepMovement(spawn, { x: 1, y: 0 }, 100, []);
    const diagonal = stepMovement(spawn, { x: 1, y: 1 }, 100, []);
    expect(Math.hypot(diagonal.x - spawn.x, diagonal.y - spawn.y)).toBeCloseTo(straight.x - spawn.x, 5);
  });
  it("blocks water, forest, building, prop and leaving the world", () => {
    expect(isBlocked(footRect({ x: 352, y: 200 }), [])).toBe(true); // river tile (22,12)
    expect(isBlocked(footRect({ x: 8, y: 30 }), [])).toBe(true); // forest
    expect(isBlocked(footRect({ x: 240, y: 80 }), [])).toBe(true); // market building
    expect(isBlocked(footRect({ x: 280, y: 176 }), [])).toBe(true); // merchant prop tile
    expect(isBlocked(footRect({ x: 4, y: 390 }), [])).toBe(true);
    expect(isBlocked(footRect(spawn), [])).toBe(false);
  });
  it("slides along a wall when only one axis is blocked", () => {
    const riverBank = { x: 331, y: 190 };
    const p = stepMovement(riverBank, { x: 1, y: -1 }, 100, []);
    expect(p.x).toBe(riverBank.x);
    expect(p.y).toBeLessThan(riverBank.y);
  });
  it("blocks decor obstacles", () => {
    expect(isBlocked(footRect({ x: 162, y: 162 }), decorObstacles())).toBe(true);
    expect(stepMovement({ x: 154, y: 163 }, { x: 1, y: 0 }, 100, decorObstacles()).x).toBe(154);
  });
  it("stops before the river when walking right from the spawn for 3s", () => {
    const p = run({ x: 1, y: 0 }, 3);
    expect(Math.floor(p.x / 16)).toBeLessThanOrEqual(20);
    expect(p.x).toBeLessThan(336);
  });
});
