export const TILE_SIZE = 20;
export const MAP_COLS = 40;
export const MAP_ROWS = 25;
export const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
export const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;

export type TilePoint = { col: number; row: number };
export type TileRect = { col: number; row: number; cols: number; rows: number };
export type WorldPoint = { x: number; y: number };
export type WorldRect = { x: number; y: number; width: number; height: number };
export type TileKind = "forest" | "grass" | "flowers" | "path" | "plaza" | "water" | "waterfall" | "bridge" | "cliff" | "building";

export const tileLegend: Readonly<Record<string, TileKind>> = {
  T: "forest", ".": "grass", ",": "flowers", "=": "path", o: "plaza",
  "~": "water", w: "waterfall", "#": "bridge", "^": "cliff", B: "building",
};

export const villageRows: readonly string[] = [
  "TTTTTTTTTTTTTTTTTTTTwwTTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTTTTTTww...............TTT",
  "TTTTTTTTT...........ww.....BBBBBB....TTT",
  "TTTTTTTTT.BBBBBBBB..~~.....BBBBBB....TTT",
  "TTTTTTTT,.BBBBBBBB..~~..,..BBBBBB..,.TTT",
  "TTTTTTT...BBBBBBBB..~~.....BBBBBB....TTT",
  "TTTTTT....BBBBBBBB.,~~.....BBBBBB...TTTT",
  "TTTTT.,...BBBBBBBB..~~.,...BBBBBB...TTTT",
  "TTTT......BBBBBBBB.=##=========.....TTTT",
  "TTBBBBBB.oooooooooo=~~..............TTTT",
  "TTBBBBBB.oooooooooo.~~^^^^^^^^^^^^^^^^TT",
  "TTBBBBBB.oooooooooo.~~^^^^^^^^^^^^^^^^TT",
  "TTBBBBBB,oooooooooo..~~...............TT",
  "TTBBBBBB.oooooooooo..~~....,......,...TT",
  "TT...====oooooooooo==##===....BBBBBB..TT",
  "TT.,.....oooooooooo..~~..=....BBBBBB..TT",
  "TT,......oooooooooo..~~..=....BBBBBB..TT",
  "TTT..........==......~~..=....BBBBBB..TT",
  "TTT..........==.....~~...===========..TT",
  "TTT.,........==.....~~...===========.TTT",
  "TTTT.........==.,...~~...===========TTTT",
  "TTTTT........==.....~~..TTTTTTTTTTTTTTTT",
  "TTTTTTT......==....T~~TTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTT...==..TTT~~TTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTT.==.TTTT~~TTTTTTTTTTTTTTTTTT",
];

export const plazaCenter: TilePoint = { col: 14, row: 13 };
export const villageEntry: TilePoint = { col: 13, row: 24 };
export const visitorSpawn: WorldPoint = { x: 330, y: 290 };

export function tileKey(point: TilePoint): string {
  return `${point.col},${point.row}`;
}

export function tileAt(col: number, row: number): TileKind | undefined {
  if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return undefined;
  return tileLegend[villageRows[row][col]];
}

export function isPathKind(kind: TileKind | undefined): boolean {
  return kind === "path" || kind === "plaza" || kind === "bridge";
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

export function tileRectToWorld(rect: TileRect): WorldRect {
  return { x: rect.col * TILE_SIZE, y: rect.row * TILE_SIZE, width: rect.cols * TILE_SIZE, height: rect.rows * TILE_SIZE };
}
