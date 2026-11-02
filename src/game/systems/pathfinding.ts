import { isWalkableKind, tileAt, type TilePoint, type WorldRect } from "../world/villageMap";

export function tileWalkable(col: number, row: number, obstacles: readonly WorldRect[]): boolean {
  if (!isWalkableKind(tileAt(col, row))) return false;
  const central = { x: col * 16 + 4, y: row * 16 + 4, width: 8, height: 8 };
  return !obstacles.some((o) => central.x < o.x + o.width && o.x < central.x + central.width && central.y < o.y + o.height && o.y < central.y + central.height);
}

const key = (c: number, r: number) => `${c},${r}`;
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const DIRS4 = DIRS8.slice(0, 4);

// A* over the tile grid; diagonals only when both orthogonal neighbours are walkable.
export function findPath(start: TilePoint, goal: TilePoint, walkable: (c: number, r: number) => boolean): TilePoint[] | null {
  if (!walkable(goal.col, goal.row) || !walkable(start.col, start.row)) return null;
  const gScore = new Map([[key(start.col, start.row), 0]]);
  const came = new Map<string, string>();
  const closed = new Set<string>();
  const open = [{ c: start.col, r: start.row, g: 0, f: 0 }];
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift()!;
    if (cur.c === goal.col && cur.r === goal.row) {
      const path: TilePoint[] = [];
      let k = key(goal.col, goal.row);
      while (came.has(k)) {
        const [c, r] = k.split(",").map(Number);
        path.unshift({ col: c, row: r });
        k = came.get(k)!;
      }
      return path;
    }
    closed.add(key(cur.c, cur.r));
    for (const [dc, dr] of DIRS8) {
      const nc = cur.c + dc, nr = cur.r + dr;
      if (!walkable(nc, nr)) continue;
      if (dc !== 0 && dr !== 0 && (!walkable(cur.c + dc, cur.r) || !walkable(cur.c, cur.r + dr))) continue;
      const nk = key(nc, nr);
      if (closed.has(nk)) continue;
      const g = cur.g + Math.hypot(dc, dr);
      if (g >= (gScore.get(nk) ?? Infinity)) continue;
      gScore.set(nk, g);
      came.set(nk, key(cur.c, cur.r));
      const f = g + Math.hypot(goal.col - nc, goal.row - nr);
      const existing = open.find((o) => o.c === nc && o.r === nr);
      if (existing) { existing.g = g; existing.f = f; } else open.push({ c: nc, r: nr, g, f });
    }
  }
  return null;
}

export function nearestReachable(start: TilePoint, goal: TilePoint, walkable: (c: number, r: number) => boolean): TilePoint | null {
  if (!walkable(start.col, start.row)) return null;
  const seen = new Set([key(start.col, start.row)]);
  const queue: TilePoint[] = [start];
  let best: TilePoint | null = null;
  let bestD = Infinity;
  while (queue.length) {
    const cur = queue.shift()!;
    const d = Math.hypot(goal.col - cur.col, goal.row - cur.row);
    if (d < bestD) { bestD = d; best = cur; }
    for (const [dc, dr] of DIRS4) {
      const nc = cur.col + dc, nr = cur.row + dr, nk = key(nc, nr);
      if (seen.has(nk) || !walkable(nc, nr)) continue;
      seen.add(nk);
      queue.push({ col: nc, row: nr });
    }
  }
  return best;
}
