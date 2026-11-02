import { isWalkableKind, tileAt, WORLD_HEIGHT, WORLD_WIDTH, type WorldPoint, type WorldRect } from "../world/villageMap";

export const PLAYER_SPEED = 72;
export const FOOT = { width: 10, height: 6 };

export function footRect(p: WorldPoint): WorldRect {
  return { x: p.x - FOOT.width / 2, y: p.y - FOOT.height, width: FOOT.width, height: FOOT.height };
}

export function isBlocked(rect: WorldRect, obstacles: readonly WorldRect[]): boolean {
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > WORLD_WIDTH || rect.y + rect.height > WORLD_HEIGHT) return true;
  const c0 = Math.floor(rect.x / 16), c1 = Math.floor((rect.x + rect.width - 0.001) / 16);
  const r0 = Math.floor(rect.y / 16), r1 = Math.floor((rect.y + rect.height - 0.001) / 16);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (!isWalkableKind(tileAt(c, r))) return true;
  return obstacles.some((o) => rect.x < o.x + o.width && o.x < rect.x + rect.width && rect.y < o.y + o.height && o.y < rect.y + rect.height);
}

export function stepMovement(p: WorldPoint, dir: { x: number; y: number }, dtMs: number, obstacles: readonly WorldRect[], speed = PLAYER_SPEED): WorldPoint {
  const len = Math.hypot(dir.x, dir.y);
  if (!len) return p;
  const step = (speed * dtMs) / 1000;
  let nx = p.x + (dir.x / len) * step;
  if (isBlocked(footRect({ x: nx, y: p.y }), obstacles)) nx = p.x;
  let ny = p.y + (dir.y / len) * step;
  if (isBlocked(footRect({ x: nx, y: ny }), obstacles)) ny = p.y;
  return { x: nx, y: ny };
}
