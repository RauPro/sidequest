import { describe, expect, it } from "vitest";
import { visitorSpawn } from "../world/villageMap";
import { cameraCenter, cameraZoom, worldToScreen } from "./camera";

describe("camera math", () => {
  it.each([
    [1280, 720, 1.8], [1920, 1080, 2.7], [412, 915, 2.2875], [375, 667, 2], [915, 412, 2],
  ])("zoom at %ix%i is %s", (w, h, expected) => {
    expect(cameraZoom(w, h)).toBeCloseTo(expected, 4);
  });
  it("clamps the centre inside the world and centres oversized views", () => {
    expect(cameraCenter(412, 915, 2.2875, { x: 0, y: 0 })).toEqual({ x: 412 / 4.575, y: 200 });
    expect(cameraCenter(412, 915, 2.2875, { x: 630, y: 390 })).toEqual({ x: 640 - 412 / 4.575, y: 200 });
    expect(cameraCenter(800, 900, 2, { x: 100, y: 100 })).toEqual({ x: 200, y: 200 });
    expect(cameraCenter(800, 900, 2, { x: 500, y: 100 })).toEqual({ x: 440, y: 200 });
  });
  it("round-trips worldToScreen", () => {
    const zoom = cameraZoom(1280, 720);
    const center = cameraCenter(1280, 720, zoom, { x: visitorSpawn.x, y: visitorSpawn.y - 12 });
    const p = worldToScreen({ x: 300, y: 200 }, 1280, 720, zoom, center);
    expect({ x: center.x + (p.x - 640) / zoom, y: center.y + (p.y - 360) / zoom }).toEqual({ x: 300, y: 200 });
  });
});
