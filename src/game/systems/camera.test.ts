import { describe, expect, it } from "vitest";
import { visitorSpawn, WORLD_HEIGHT, WORLD_WIDTH } from "../world/villageMap";
import { cameraCenter, cameraZoom, worldToScreen } from "./camera";

const viewports = [[1280, 720], [1920, 1080], [1586, 992], [412, 915], [375, 667], [915, 412]] as const;

describe("camera math", () => {
  it.each(viewports)("zoom at %ix%i shows the whole world or crops at 2-3x", (w, h) => {
    const fit = Math.min(w / WORLD_WIDTH, h / WORLD_HEIGHT);
    const zoom = cameraZoom(w, h);
    if (fit >= 1.5) expect(zoom).toBeCloseTo(fit, 6);
    else {
      expect(zoom).toBeGreaterThanOrEqual(2);
      expect(zoom).toBeLessThanOrEqual(3);
    }
  });
  it.each(viewports)("clamps the centre inside the world and centres oversized views at %ix%i", (w, h) => {
    const zoom = cameraZoom(w, h);
    const halfW = w / (2 * zoom);
    const halfH = h / (2 * zoom);
    const expectAxis = (value: number, half: number, size: number, edge: "min" | "max") => {
      if (half * 2 >= size) expect(value).toBeCloseTo(size / 2, 6);
      else expect(value).toBeCloseTo(edge === "min" ? half : size - half, 6);
    };
    const low = cameraCenter(w, h, zoom, { x: 0, y: 0 });
    expectAxis(low.x, halfW, WORLD_WIDTH, "min");
    expectAxis(low.y, halfH, WORLD_HEIGHT, "min");
    const high = cameraCenter(w, h, zoom, { x: WORLD_WIDTH, y: WORLD_HEIGHT });
    expectAxis(high.x, halfW, WORLD_WIDTH, "max");
    expectAxis(high.y, halfH, WORLD_HEIGHT, "max");
  });
  it("round-trips worldToScreen", () => {
    const zoom = cameraZoom(1280, 720);
    const center = cameraCenter(1280, 720, zoom, { x: visitorSpawn.x, y: visitorSpawn.y - 12 });
    const world = { x: WORLD_WIDTH * 0.47, y: WORLD_HEIGHT * 0.5 };
    const p = worldToScreen(world, 1280, 720, zoom, center);
    const back = { x: center.x + (p.x - 640) / zoom, y: center.y + (p.y - 360) / zoom };
    expect(back.x).toBeCloseTo(world.x, 6);
    expect(back.y).toBeCloseTo(world.y, 6);
  });
});
