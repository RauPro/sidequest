import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { containsPoint, TILE_SIZE, tileAt } from "./villageMap";
import { walkAreas } from "./walkAreas";
import {
  ducks,
  FX_FRAMES,
  FX_HEIGHT,
  FX_WIDTH,
  fxBounds,
  lights,
  npcs,
  occluders,
  sway,
  water,
} from "./villageFx";
import { npcAreaTiles } from "../systems/npc";

const pngDimensions = (path: string) => {
  const png = readFileSync(path);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

describe("village FX data", () => {
  it("keeps FX polygon bounds non-empty and inside the world", () => {
    for (const [prefix, regions] of [
      ["water", water],
      ["sway", sway],
      ["occluder", occluders],
    ] as const) {
      for (const region of regions) {
        const bounds = fxBounds(region.polygon);
        const xs = region.polygon.map(([x]) => x);
        const ys = region.polygon.map(([, y]) => y);
        expect(bounds.width, `${prefix}-${region.id} width`).toBeGreaterThan(0);
        expect(bounds.height, `${prefix}-${region.id} height`).toBeGreaterThan(0);
        expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...xs)).toBeLessThanOrEqual(FX_WIDTH);
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...ys)).toBeLessThanOrEqual(FX_HEIGHT);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(FX_WIDTH);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(FX_HEIGHT);
      }
    }
  });

  it("keeps FX strip and occluder PNG dimensions aligned with computed bounds", () => {
    expect(FX_FRAMES).toBe(8);
    for (const region of water) {
      const bounds = fxBounds(region.polygon);
      expect(pngDimensions(`public/game/fx/water-${region.id}.png`)).toEqual({
        width: bounds.width * FX_FRAMES,
        height: bounds.height,
      });
    }
    for (const region of sway) {
      const bounds = fxBounds(region.polygon);
      expect(pngDimensions(`public/game/fx/sway-${region.id}.png`)).toEqual({
        width: bounds.width * FX_FRAMES,
        height: bounds.height,
      });
    }
    for (const region of occluders) {
      const bounds = fxBounds(region.polygon);
      expect(pngDimensions(`public/game/fx/occluder-${region.id}.png`)).toEqual({
        width: bounds.width,
        height: bounds.height,
      });
    }
  });

  it("places NPCs, ducks, and lights in their declared world bounds", () => {
    for (const npc of npcs) {
      if (npc.behavior === "wander") {
        for (const area of npc.areas) expect(walkAreas[area], `${npc.id} area ${area}`).toBeDefined();
        const homeTile = {
          col: Math.floor(npc.home[0] / TILE_SIZE),
          row: Math.floor(npc.home[1] / TILE_SIZE),
        };
        const areaTiles = npcAreaTiles(npc.areas);
        expect(tileAt(homeTile.col, homeTile.row)).toBe("walkable");
        expect(areaTiles).toContainEqual(homeTile);
      } else {
        expect(npc.home[0]).toBeGreaterThanOrEqual(npc.range[0]);
        expect(npc.home[0]).toBeLessThanOrEqual(npc.range[1]);
      }
    }
    for (const [x, y] of ducks.spawns) expect(containsPoint(x, y, ducks.area)).toBe(true);
    for (const light of lights) {
      expect(light.x).toBeGreaterThanOrEqual(0);
      expect(light.x).toBeLessThanOrEqual(FX_WIDTH);
      expect(light.y).toBeGreaterThanOrEqual(0);
      expect(light.y).toBeLessThanOrEqual(FX_HEIGHT);
    }
  });
});
