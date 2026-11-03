import { WORLD_HEIGHT, WORLD_WIDTH, type WorldPoint } from "../world/villageMap";

export function cameraZoom(viewW: number, viewH: number): number {
  return Math.max(viewW / WORLD_WIDTH, viewH / WORLD_HEIGHT);
}

// View centre follows `focus`, clamped inside the world; centred on any axis
// where the view is larger than the world.
export function cameraCenter(viewW: number, viewH: number, zoom: number, focus: WorldPoint): WorldPoint {
  const halfW = viewW / (2 * zoom);
  const halfH = viewH / (2 * zoom);
  const x = halfW * 2 >= WORLD_WIDTH ? WORLD_WIDTH / 2 : Math.min(Math.max(focus.x, halfW), WORLD_WIDTH - halfW);
  const y = halfH * 2 >= WORLD_HEIGHT ? WORLD_HEIGHT / 2 : Math.min(Math.max(focus.y, halfH), WORLD_HEIGHT - halfH);
  return { x, y };
}

export function worldToScreen(p: WorldPoint, viewW: number, viewH: number, zoom: number, center: WorldPoint): WorldPoint {
  return { x: viewW / 2 + (p.x - center.x) * zoom, y: viewH / 2 + (p.y - center.y) * zoom };
}
