import {
  blockedAreas,
  spawnPoint,
  walkAreas,
  type LocationId,
  type WalkPolygon,
} from "./walkAreas";

export type { LocationId } from "./walkAreas";

export const TILE_SIZE = 32;
export const MAP_COLS = 48;
export const MAP_ROWS = 32;
export const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
export const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;

export const locationIds = ["market", "oracle", "camp", "post"] as const satisfies readonly LocationId[];

export type TilePoint = { col: number; row: number };
export type TileRect = { col: number; row: number; cols: number; rows: number };
export type WorldPoint = { x: number; y: number };
export type WorldRect = { x: number; y: number; width: number; height: number };
export type TileKind = "blocked" | "walkable";

export const tileLegend: Readonly<Record<string, TileKind>> = { "#": "blocked", ".": "walkable" };

function onPolygonEdge(x: number, y: number, [ax, ay]: readonly [number, number], [bx, by]: readonly [number, number]) {
  const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
  return Math.abs(cross) < 1e-7
    && x >= Math.min(ax, bx) - 1e-7 && x <= Math.max(ax, bx) + 1e-7
    && y >= Math.min(ay, by) - 1e-7 && y <= Math.max(ay, by) + 1e-7;
}

export function containsPoint(x: number, y: number, polygon: WalkPolygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (onPolygonEdge(x, y, polygon[i], polygon[j])) return true;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const villageRows: readonly string[] = Array.from({ length: MAP_ROWS }, (_, row) =>
  Array.from({ length: MAP_COLS }, (_, col) => {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const walkable = Object.values(walkAreas).some((polygon) => containsPoint(x, y, polygon));
    const blocked = Object.values(blockedAreas).some((polygon) => containsPoint(x, y, polygon));
    return walkable && !blocked ? "." : "#";
  }).join(""),
);

export const visitorSpawn: WorldPoint = { x: spawnPoint[0], y: spawnPoint[1] };

export function tileKey(point: TilePoint): string {
  return `${point.col},${point.row}`;
}

export function tileAt(col: number, row: number): TileKind | undefined {
  if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return undefined;
  return tileLegend[villageRows[row][col]];
}

export function isPathKind(kind: TileKind | undefined): boolean {
  return kind === "walkable";
}

export function isWalkableKind(kind: TileKind | undefined): boolean {
  return isPathKind(kind);
}

export function reachableTiles(start: TilePoint, passable: (kind: TileKind) => boolean): Set<string> {
  const startKind = tileAt(start.col, start.row);
  const reached = new Set<string>();
  if (!startKind || !passable(startKind)) return reached;
  const queue: TilePoint[] = [start];
  reached.add(tileKey(start));
  while (queue.length > 0) {
    const { col, row } = queue.pop() as TilePoint;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const next = { col: col + dc, row: row + dr };
      const kind = tileAt(next.col, next.row);
      const key = tileKey(next);
      if (kind === undefined || !passable(kind) || reached.has(key)) continue;
      reached.add(key);
      queue.push(next);
    }
  }
  return reached;
}

export function nearestWalkableTile(point: WorldPoint): TilePoint {
  const origin = { col: Math.floor(point.x / TILE_SIZE), row: Math.floor(point.y / TILE_SIZE) };
  if (isWalkableKind(tileAt(origin.col, origin.row))) return origin;

  let nearest: TilePoint | undefined;
  let nearestDistance = Infinity;
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      if (!isWalkableKind(tileAt(col, row))) continue;
      const distance = Math.hypot(col - origin.col, row - origin.row);
      if (distance < nearestDistance) {
        nearest = { col, row };
        nearestDistance = distance;
      }
    }
  }
  if (!nearest) throw new Error("Village walk grid has no walkable tiles");
  return nearest;
}

export function tileRectToWorld(rect: TileRect): WorldRect {
  return {
    x: rect.col * TILE_SIZE,
    y: rect.row * TILE_SIZE,
    width: rect.cols * TILE_SIZE,
    height: rect.rows * TILE_SIZE,
  };
}
