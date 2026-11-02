export const TILE_SIZE = 16;
export const MAP_COLS = 40;
export const MAP_ROWS = 25;
export const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
export const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;

export const locationIds = ["market", "oracle", "camp", "post"] as const;
export type LocationId = (typeof locationIds)[number];

export type TilePoint = { col: number; row: number };
export type TileRect = { col: number; row: number; cols: number; rows: number };
export type WorldPoint = { x: number; y: number };
export type WorldRect = { x: number; y: number; width: number; height: number };
export type TileKind = "forest" | "grass" | "flowers" | "path" | "plaza" | "water" | "waterfall" | "bridge" | "cliff" | "stairs" | "building" | "prop";

export const tileLegend: Readonly<Record<string, TileKind>> = {
  T: "forest", ".": "grass", ",": "flowers", "=": "path", o: "plaza", "~": "water",
  w: "waterfall", "#": "bridge", "^": "cliff", s: "stairs", B: "building", x: "prop",
};

export const villageRows: readonly string[] = [
  "TTTTTTTTTTTTTTTTTTTT~~TTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTTTTTT~~TTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTTTTTT~~^^..BBBBB...TTTTTT",
  "TTTTTTTTTTBBBBBBBBBT~~^^..BBBBB...TTTTTT",
  "TTTTTTTTT.BBBBBBBBB.ww^^,.BBBBB...TTTTTT",
  "TTTTTTTT,.BBBBBBBBB.ww^^..BBBBB..,TTTTTT",
  "TTTTTTT...BBBBBBBBB.ww^^..BBBBB...TTTTTT",
  "TTTTTT.,..BBBBBBBBB.~~~^..BBBBB...TTTTTT",
  "TTTTT.....BBBBBBBBB.=###====x===..TTTTTT",
  "TBBBBBB...BBBBBBBBB.=~~~=========.TTTTTT",
  "TBBBBBB.,..ooooooxoo=~~~^^^^^^^ss^TTTTTT",
  "TBBBBBB..,ooooooooooo~~~^^^^^^^ss^TTTTTT",
  "TBBBBBB..oooooooooooo~~~.......==.TTTTTT",
  "TBBBBBBx,oooooooooooo~~~~......=..TTTTTT",
  "TBBBBBB.ooooooooooooo####=======..TTTTTT",
  "TBBBBBBxooooooooooooo####=........TTTTTT",
  "TBBBBBBoooooooooooo..~~~~=..BBBBBBTTTTTT",
  "Txoooooooooooooooo...~~~~=x.BBBBBBTTTTTT",
  "TT,.ooooooooooooo....~~~.===BBBBBBTTTTTT",
  "TT.,.........===.....~~~====BBBBBBTTTTTT",
  "TT,........,.===.....~~~==xxx==x==TTTTTT",
  "TTT..........===...^www^==========TTTTTT",
  "TTTTT......,.===..T^www^T........TTTTTTT",
  "TTTTTTTTTTTT.===.TTT~~~TTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTT===TTTT~~~TTTTTTTTTTTTTTTTT",
];

export const plazaCenter: TilePoint = { col: 15, row: 13 };
export const villageEntry: TilePoint = { col: 14, row: 24 };
export const visitorSpawn: WorldPoint = { x: 296, y: 190 };

export type VillageProp = { id: string; col: number; row: number; location?: LocationId };

// Prop tiles are blocked: each holds one prop or NPC sprite.
export const villageProps: readonly VillageProp[] = [
  { id: "merchant", col: 17, row: 10, location: "market" },
  { id: "oracle-table", col: 28, row: 8, location: "oracle" },
  { id: "post-sign", col: 7, row: 13, location: "post" },
  { id: "mailbox", col: 7, row: 15, location: "post" },
  { id: "cat-crate", col: 1, row: 17 },
  { id: "camp-sign", col: 26, row: 17, location: "camp" },
  { id: "log-seat", col: 26, row: 20, location: "camp" },
  { id: "campfire", col: 27, row: 20, location: "camp" },
  { id: "camp-kid", col: 28, row: 20, location: "camp" },
  { id: "dog", col: 31, row: 20, location: "camp" },
];

export function tileKey(point: TilePoint): string {
  return `${point.col},${point.row}`;
}

export function tileAt(col: number, row: number): TileKind | undefined {
  if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return undefined;
  return tileLegend[villageRows[row][col]];
}

export function isPathKind(kind: TileKind | undefined): boolean {
  return kind === "path" || kind === "plaza" || kind === "bridge" || kind === "stairs";
}

export function isWalkableKind(kind: TileKind | undefined): boolean {
  return kind === "grass" || kind === "flowers" || isPathKind(kind);
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
