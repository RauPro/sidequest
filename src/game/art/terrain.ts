import { ART_TILE, Ctx, Rng, pick, pixel, rect, ring } from "./canvas";
import { palette as p } from "./palette";
import { MAP_COLS, MAP_ROWS, TileKind, isPathKind, tileAt } from "../world/villageMap";

const at = (c: number, r: number) => tileAt(c, r);
const isLand = (k: TileKind | undefined) => k !== undefined && k !== "water" && k !== "waterfall" && k !== "bridge";

function bankFoam(ctx: Ctx, rng: Rng, x: number, y: number, dir: 1 | -1) {
  for (let i = 0; i < 10; i++) {
    if (rng() > 0.45) continue;
    const color = () => (rng() < 0.25 ? p.foam : p.water[2]);
    pixel(ctx, x + dir * Math.floor(rng() * 2), y + i, color());
    if (rng() < 0.2) pixel(ctx, x + dir * Math.floor(rng() * 2), y + Math.min(9, i + 1), color());
  }
}

function grassTile(ctx: Ctx, rng: Rng, x: number, y: number, lifted = false) {
  const ramp = lifted ? p.grassHigh : p.grass;
  rect(ctx, x, y, ART_TILE, ART_TILE, ramp[0]);
  for (let i = 0; i < 7; i++) pixel(ctx, x + Math.floor(rng() * 10), y + Math.floor(rng() * 10), pick(rng, ramp));
  if (rng() < 0.5) rect(ctx, x + Math.floor(rng() * 8), y + 2 + Math.floor(rng() * 6), 1, 2, ramp[1]);
}

function forestTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, ART_TILE, ART_TILE, p.forest[0]);
  for (let i = 0; i < 9; i++) {
    const color = pick(rng, p.forest);
    rect(ctx, x + Math.floor(rng() * 8), y + Math.floor(rng() * 8), 2 + Math.floor(rng() * 2), 2, color);
  }
  for (let i = 0; i < 3; i++) pixel(ctx, x + Math.floor(rng() * 10), y + Math.floor(rng() * 10), p.forestDark);
}

function flowersTile(ctx: Ctx, rng: Rng, x: number, y: number, lifted = false) {
  grassTile(ctx, rng, x, y, lifted);
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
  // irregular slabs: lit top-left edge, darker lower-right
  for (let i = 0; i < 3; i++) {
    const sx = x + Math.floor(rng() * 5);
    const sy = y + Math.floor(rng() * 6);
    const sw = 3 + Math.floor(rng() * 4);
    const sh = 2 + Math.floor(rng() * 2);
    rect(ctx, sx, sy, sw, sh, p.cliff[0]);
    rect(ctx, sx, sy, sw, 1, p.cliff[2]);
    rect(ctx, sx + sw - 1, sy + 1, 1, sh - 1, "#2e2d36");
    if (rng() < 0.5) pixel(ctx, sx, sy + sh - 1, "#2e2d36");
  }
  if (rng() < 0.7) rect(ctx, x + 2 + Math.floor(rng() * 6), y + 1, 1, 3 + Math.floor(rng() * 4), "#2e2d36");
  for (let i = 0; i < 2; i++) pixel(ctx, x + Math.floor(rng() * 10), y + Math.floor(rng() * 10), p.moss);
  rect(ctx, x, y + 8, ART_TILE, 2, "rgba(8, 10, 14, 0.22)");
}

export function paintTerrain(ctx: Ctx, rng: Rng) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const kind = at(c, r);
      const x = c * ART_TILE;
      const y = r * ART_TILE;
      const lifted = r <= 9 && c >= 22;
      switch (kind) {
        case "forest": forestTile(ctx, rng, x, y); break;
        case "flowers": flowersTile(ctx, rng, x, y, lifted); break;
        case "path": pathTile(ctx, rng, x, y, c, r); break;
        case "plaza": plazaTile(ctx, rng, x, y); break;
        case "water": waterTile(ctx, rng, x, y); break;
        case "waterfall": waterfallTile(ctx, rng, x, y); break;
        case "bridge": bridgeTile(ctx, x, y); break;
        case "cliff": cliffTile(ctx, rng, x, y); break;
        default: grassTile(ctx, rng, x, y, lifted); break;
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
        rect(ctx, x, y + 8, ART_TILE, 2, "rgba(10, 20, 14, 0.55)");
        const trunks = rng() < 0.3 ? 0 : 1 + Math.floor(rng() * 2);
        for (let i = 0; i < trunks; i++) {
          const th = 3 + Math.floor(rng() * 3);
          rect(ctx, x + 1 + Math.floor(rng() * 7), y + 10 - th, 2, th, p.trunk);
        }
        for (let i = 0; i < 2 + Math.floor(rng() * 3); i++) rect(ctx, x + Math.floor(rng() * 9), y + 9 + Math.floor(rng() * 2), 2, 2, pick(rng, p.forest));
      }
      if (kind === "water") {
        if (isLand(at(c - 1, r))) bankFoam(ctx, rng, x, y, 1);
        if (isLand(at(c + 1, r))) bankFoam(ctx, rng, x + 9, y, -1);
        if (at(c, r - 1) === "waterfall") {
          for (let i = 0; i < 10; i++) pixel(ctx, x + i, y + (i % 2), p.foam);
          for (let i = 1; i < 9; i += 2) pixel(ctx, x + i, y + 2, p.foam);
        }
      }
      if (kind === "plaza") {
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const next = at(c + dc, r + dr);
          if (next === undefined || next === "plaza" || isPathKind(next) || next === "water" || next === "bridge") continue;
          for (let i = 0; i < 10; i++) {
            const ex = dc === 0 ? x + i : x + (dc > 0 ? 9 : 0);
            const ey = dr === 0 ? y + i : y + (dr > 0 ? 9 : 0);
            pixel(ctx, ex, ey, p.curb[0]);
            pixel(ctx, ex - dc, ey - dr, p.curb[1]);
          }
        }
      }
      if (kind === "waterfall" && at(c, r + 1) === "water") {
        for (let i = 0; i < 10; i++) pixel(ctx, x + i, y + 8 + (i % 2), p.foam);
      }
      if (kind === "cliff") {
        if (at(c, r - 1) !== "cliff") {
          rect(ctx, x, y, ART_TILE, 1, "#8a89a0");
          for (let i = 0; i < 10; i++) {
            if (rng() > 0.6) continue;
            rect(ctx, x + i, y - 1 - Math.floor(rng() * 2), 2, 2 + Math.floor(rng() * 2), pick(rng, p.grassHigh));
          }
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
