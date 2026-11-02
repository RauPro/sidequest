import { ART_TILE, Ctx, Rng, pick, pixel, rect, ring } from "./canvas";
import { palette as p } from "./palette";
import { MAP_COLS, MAP_ROWS, TileKind, isPathKind, tileAt } from "../world/villageMap";

const at = (c: number, r: number) => tileAt(c, r);
const isLand = (k: TileKind | undefined) => k !== undefined && k !== "water" && k !== "waterfall" && k !== "bridge";

function grassTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.grass[0]);
  for (let i = 0; i < 7; i++) pixel(ctx, x + Math.floor(rng() * 10), y + Math.floor(rng() * 10), pick(rng, p.grass));
  if (rng() < 0.5) rect(ctx, x + Math.floor(rng() * 8), y + 2 + Math.floor(rng() * 6), 1, 2, p.grass[1]);
}

function forestTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.forest[0]);
  for (let i = 0; i < 9; i++) {
    const color = pick(rng, p.forest);
    rect(ctx, x + Math.floor(rng() * 8), y + Math.floor(rng() * 8), 2 + Math.floor(rng() * 2), 2, color);
  }
  for (let i = 0; i < 3; i++) pixel(ctx, x + Math.floor(rng() * 10), y + Math.floor(rng() * 10), p.forestDark);
}

function flowersTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  grassTile(ctx, rng, x, y);
  for (let i = 0; i < 4; i++) {
    const fx = x + 1 + Math.floor(rng() * 8);
    const fy = y + 1 + Math.floor(rng() * 8);
    pixel(ctx, fx, fy + 1, p.grass[1]);
    pixel(ctx, fx, fy, pick(rng, p.flowers));
  }
}

function pathTile(ctx: Ctx, rng: Rng, x: number, y: number, c: number, r: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.dirt[0]);
  for (let i = 0; i < 8; i++) pixel(ctx, x + Math.floor(rng() * 10), y + Math.floor(rng() * 10), pick(rng, p.dirt));
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const next = at(c + dc, r + dr);
    if (next !== undefined && !isPathKind(next)) {
      for (let i = 0; i < 10; i++) {
        if ((i + c + r) % 4 === 0) continue;
        const px = dc === 0 ? x + i : x + (dc > 0 ? 9 : 0);
        const py = dr === 0 ? y + i : y + (dr > 0 ? 9 : 0);
        pixel(ctx, px, py, p.dirt[2]);
      }
    }
  }
}

function plazaTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.cobble[0]);
  for (let i = 0; i < 5; i++) {
    rect(ctx, x + Math.floor(rng() * 7), y + Math.floor(rng() * 7), 2 + Math.floor(rng() * 2), 2, pick(rng, [p.cobble[1], p.cobble[2]]));
  }
  for (let i = 0; i < 4; i++) pixel(ctx, x + Math.floor(rng() * 10), y + Math.floor(rng() * 10), p.cobble[2]);
}

function waterTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.water[0]);
  for (let i = 0; i < 4; i++) {
    rect(ctx, x + Math.floor(rng() * 8), y + Math.floor(rng() * 9), 2 + Math.floor(rng() * 2), 1, pick(rng, [p.water[1], p.water[2]]));
  }
}

function waterfallTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.water[1]);
  for (let sx = 0; sx < 10; sx += 2) {
    rect(ctx, x + sx, y, 1, ART_TILE, sx % 4 === 0 ? p.foam : p.water[2]);
  }
}

function bridgeTile(ctx: Ctx, x: number, y: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.wood[1]);
  for (let sx = 0; sx < 10; sx += 3) rect(ctx, x + sx, y, 2, ART_TILE, sx % 6 === 0 ? p.wood[0] : p.wood[2]);
  rect(ctx, x, y + 1, ART_TILE, 1, p.rope);
  rect(ctx, x, y + 8, ART_TILE, 1, p.rope);
  for (const px of [x, x + 8]) {
    rect(ctx, px, y, 2, 3, p.wood[1]);
    rect(ctx, px, y + 7, 2, 3, p.wood[1]);
  }
}

function cliffTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.cliff[1]);
  for (let band = 0; band < 4; band++) {
    const by = y + band * 2 + Math.floor(rng() * 3);
    const bx = x + Math.floor(rng() * 5);
    rect(ctx, bx, by, 3 + Math.floor(rng() * 4), 1, pick(rng, [p.cliff[0], p.cliff[2]]));
  }
  rect(ctx, x + Math.floor(rng() * 6), y + 1 + Math.floor(rng() * 3), 1, 2, p.cliff[2]);
  if (rng() < 0.7) rect(ctx, x + 2 + Math.floor(rng() * 6), y + 1, 1, 3 + Math.floor(rng() * 4), "#2e2d36");
}

export function paintTerrain(ctx: Ctx, rng: Rng) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const kind = at(c, r);
      const x = c * ART_TILE;
      const y = r * ART_TILE;
      switch (kind) {
        case "forest": forestTile(ctx, rng, x, y); break;
        case "flowers": flowersTile(ctx, rng, x, y); break;
        case "path": pathTile(ctx, rng, x, y, c, r); break;
        case "plaza": plazaTile(ctx, rng, x, y); break;
        case "water": waterTile(ctx, rng, x, y); break;
        case "waterfall": waterfallTile(ctx, rng, x, y); break;
        case "bridge": bridgeTile(ctx, x, y); break;
        case "cliff": cliffTile(ctx, rng, x, y); break;
        default: grassTile(ctx, rng, x, y); break;
      }
    }
  }
  paintTerrainEdges(ctx, rng);
  ring(ctx, 140, 128, 6, 8, "#6f8a52");
  ring(ctx, 140, 128, 2, 3, "#6f8a52");
  pixel(ctx, 140, 128, "#6f8a52");
  pixel(ctx, 138, 126, "#6f8a52");
  pixel(ctx, 142, 130, "#6f8a52");
}

// Second pass for details that bleed across tile borders.
function paintTerrainEdges(ctx: Ctx, rng: Rng) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const kind = at(c, r);
      const x = c * ART_TILE;
      const y = r * ART_TILE;
      if (kind === "forest" && at(c, r + 1) !== "forest") {
        rect(ctx, x + 2, y + 5, 2, 5, p.trunk);
        rect(ctx, x + 7, y + 6, 2, 4, p.trunk);
        rect(ctx, x, y + 8, ART_TILE, 2, "rgba(10, 20, 14, 0.55)");
        for (let i = 0; i < 4; i++) rect(ctx, x + Math.floor(rng() * 9), y + 9, 2, 2, pick(rng, p.forest));
      }
      if (kind === "water") {
        if (isLand(at(c - 1, r))) for (let i = 0; i < 10; i += 2) pixel(ctx, x, y + i + ((c + i) % 2), p.foam);
        if (isLand(at(c + 1, r))) for (let i = 0; i < 10; i += 2) pixel(ctx, x + 9, y + i + ((c + i) % 2), p.foam);
        if (at(c, r - 1) === "waterfall") {
          for (let i = 0; i < 10; i++) pixel(ctx, x + i, y + (i % 2), p.foam);
          for (let i = 1; i < 9; i += 2) pixel(ctx, x + i, y + 2, p.foam);
        }
      }
      if (kind === "waterfall" && at(c, r + 1) === "water") {
        for (let i = 0; i < 10; i++) pixel(ctx, x + i, y + 8 + (i % 2), p.foam);
      }
      if (kind === "cliff") {
        if (at(c, r - 1) !== "cliff") {
          rect(ctx, x, y, ART_TILE, 1, "#8a89a0");
          for (let i = 0; i < 10; i += 2) rect(ctx, x + i, y - 1, 2, 3, pick(rng, p.grass));
          rect(ctx, x, y + 1, ART_TILE, 1, "rgba(120, 160, 110, 0.35)");
        }
        if (at(c, r + 1) !== "cliff") {
          rect(ctx, x, y + 9, ART_TILE, 1, "rgba(8, 10, 14, 0.5)");
          rect(ctx, x, y + 10, ART_TILE, 2, "rgba(8, 10, 14, 0.25)");
        }
      }
    }
  }
}
