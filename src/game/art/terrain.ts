import { Ctx, Rng, ellipse, pick, pixel, rect, ring, sprite } from "./canvas";
import { palette as p } from "./palette";
import { MAP_COLS, MAP_ROWS, TileKind, isPathKind, isWalkableKind, tileAt } from "../world/villageMap";
import { createRng } from "./canvas";

const T = 16;
const at = (c: number, r: number) => tileAt(c, r);
const isWater = (k: TileKind | undefined) => k === "water" || k === "waterfall";
const isLand = (k: TileKind | undefined) => k !== undefined && !isWater(k) && k !== "bridge";

function grassTile(ctx: Ctx, rng: Rng, x: number, y: number, lifted = false) {
  const ramp = lifted ? p.grassHigh : p.grass;
  rect(ctx, x, y, T, T, ramp[0]);
  for (let i = 0; i < 14; i++) pixel(ctx, x + Math.floor(rng() * 16), y + Math.floor(rng() * 16), pick(rng, ramp));
  for (let i = 0; i < 2; i++) {
    const tx = x + 1 + Math.floor(rng() * 13);
    const ty = y + 1 + Math.floor(rng() * 12);
    rect(ctx, tx, ty, 1, 3, p.tuft);
    rect(ctx, tx + 1, ty + 1, 1, 2, ramp[1]);
  }
}

function flowersTile(ctx: Ctx, rng: Rng, x: number, y: number, lifted = false) {
  grassTile(ctx, rng, x, y, lifted);
  for (let i = 0; i < 8; i++) {
    const fx = x + 1 + Math.floor(rng() * 14);
    const fy = y + 1 + Math.floor(rng() * 13);
    const color = pick(rng, p.flowers);
    pixel(ctx, fx, fy + 1, p.grass[1]);
    pixel(ctx, fx, fy, color);
    if (rng() < 0.5) pixel(ctx, fx + 1, fy, color);
  }
}

function pathTile(ctx: Ctx, rng: Rng, x: number, y: number, c: number, r: number) {
  rect(ctx, x, y, T, T, p.dirt[0]);
  for (let i = 0; i < 12; i++) pixel(ctx, x + Math.floor(rng() * 16), y + Math.floor(rng() * 16), pick(rng, p.dirt));
  for (let i = 0; i < 3; i++) rect(ctx, x + Math.floor(rng() * 12), y + Math.floor(rng() * 12), 2, 1, p.dirt[3]);
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const next = at(c + dc, r + dr);
    if (next !== "grass" && next !== "flowers") continue;
    for (let i = 0; i < 16; i += 3) {
      if (rng() > 0.5) continue;
      const ex = dc === 0 ? x + i : x + (dc > 0 ? 15 : 0);
      const ey = dr === 0 ? y + i : y + (dr > 0 ? 15 : 0);
      pixel(ctx, ex, ey, p.dirt[2]);
      if (rng() < 0.4) rect(ctx, ex + (dc === 0 ? 0 : dc), ey + (dr === 0 ? 0 : dr) - 1, 1, 2, p.tuft);
    }
  }
}

function plazaTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, T, T, p.mortar);
  // irregular stones with a top-left glint
  for (const [sx, sy, sw, sh] of [[0, 0, 7, 5], [8, 0, 8, 4], [0, 6, 5, 4], [6, 5, 6, 5], [13, 5, 3, 5], [0, 11, 8, 5], [9, 11, 7, 5], [12, 1, 4, 3]] as const) {
    const color = pick(rng, [p.cobble[0], p.cobble[1], p.cobble[0], p.cobble[3]]);
    rect(ctx, x + sx, y + sy, sw, sh, color);
    pixel(ctx, x + sx, y + sy, p.cobble[3]);
    pixel(ctx, x + sx + 1, y + sy, p.cobble[3]);
    if (rng() < 0.25) pixel(ctx, x + sx + Math.floor(rng() * sw), y + sy + sh - 1, p.cobble[2]);
  }
}

function waterTile(ctx: Ctx, rng: Rng, x: number, y: number) {
  rect(ctx, x, y, T, T, p.water[0]);
  for (let i = 0; i < 6; i++) {
    rect(ctx, x + Math.floor(rng() * 12), y + Math.floor(rng() * 14), 3 + Math.floor(rng() * 3), 1, pick(rng, [p.water[1], p.water[2]]));
  }
}

function waterfallTile(ctx: Ctx, rng: Rng, x: number, y: number, c: number, r: number) {
  rect(ctx, x, y, T, T, p.water[1]);
  for (let sx = 1; sx < 16; sx += 3) rect(ctx, x + sx, y, 1, T, sx % 2 === 0 ? p.foam : p.water[3]);
  if (at(c, r + 1) === "water") {
    for (let i = 0; i < 16; i++) pixel(ctx, x + i, y + 12 + (i % 4), rng() < 0.7 ? p.foam : p.water[3]);
    for (let i = 0; i < 10; i++) pixel(ctx, x + 2 + i, y + 14 + (i % 2), p.water[3]);
  }
}

function bridgeTile(ctx: Ctx, x: number, y: number, c: number, r: number) {
  rect(ctx, x, y, T, T, p.wood[1]);
  for (let sx = 0; sx < 16; sx += 4) rect(ctx, x + sx + 1, y, 3, T, sx % 8 === 0 ? p.wood[0] : p.wood[2]);
  if (at(c, r - 1) !== "bridge") {
    rect(ctx, x, y, T, 2, p.wood[1]);
    rect(ctx, x, y + 1, T, 1, p.wood[2]);
    for (const px of [x + 1, x + 14]) rect(ctx, px, y - 3, 2, 6, p.wood[1]);
  }
  rect(ctx, x, y + 14, T, 2, p.wood[1]);
}

function cliffTile(ctx: Ctx, rng: Rng, x: number, y: number, c: number, r: number) {
  rect(ctx, x, y, T, T, p.cliff[2]);
  // big irregular slabs: lit top edge, dark under-edge
  for (let i = 0; i < 3; i++) {
    const sx = x + Math.floor(rng() * 8);
    const sy = y + 1 + Math.floor(rng() * 9);
    const sw = 6 + Math.floor(rng() * 7);
    const sh = 3 + Math.floor(rng() * 4);
    rect(ctx, sx, sy, sw, sh, p.cliff[0]);
    rect(ctx, sx, sy, sw, 1, p.cliff[3]);
    rect(ctx, sx, sy + sh - 1, sw, 1, p.cliff[1]);
    if (rng() < 0.5) rect(ctx, sx + 1, sy + 1, 2, 1, p.cliff[3]);
  }
  // vertical cracks between strata
  for (let i = 0; i < 2; i++) {
    if (rng() < 0.4) continue;
    rect(ctx, x + 2 + Math.floor(rng() * 12), y + Math.floor(rng() * 4), 1, 5 + Math.floor(rng() * 7), p.cliff[1]);
  }
  for (let i = 0; i < 4; i++) pixel(ctx, x + Math.floor(rng() * 16), y + Math.floor(rng() * 16), p.moss);
  for (let i = 0; i < 3; i++) pixel(ctx, x + Math.floor(rng() * 16), y + Math.floor(rng() * 16), p.cliff[3]);
  rect(ctx, x, y + 13, T, 3, "rgba(6, 10, 14, 0.35)");
  if (at(c, r - 1) !== "cliff") {
    for (let i = 0; i < 16; i += 2) {
      if (rng() < 0.7) rect(ctx, x + i, y - 1 - Math.floor(rng() * 3), 2, 3 + Math.floor(rng() * 3), pick(rng, p.grassHigh));
    }
    // hanging vines
    for (let i = 0; i < 3; i++) {
      if (rng() < 0.5) continue;
      const vx = x + 1 + Math.floor(rng() * 13);
      rect(ctx, vx, y + 1, 1, 3 + Math.floor(rng() * 6), p.moss);
    }
    rect(ctx, x, y, T, 1, p.cliff[3]);
  }
}

function stairsTile(ctx: Ctx, x: number, y: number) {
  rect(ctx, x, y, T, T, p.stone[1]);
  for (let i = 0; i < 4; i++) {
    rect(ctx, x, y + i * 4, T, 1, p.stone[0]);
    rect(ctx, x, y + i * 4 + 1, T, 1, p.cliff[2]);
    rect(ctx, x, y + i * 4 + 2, T, 2, p.stone[1]);
  }
  rect(ctx, x, y, 1, T, p.cliff[2]);
  rect(ctx, x + 15, y, 1, T, p.cliff[2]);
}

function paintTiles(ctx: Ctx, rng: Rng) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const kind = at(c, r) as TileKind;
      const x = c * T;
      const y = r * T;
      const lifted = r <= 9 && c >= 22;
      switch (kind) {
        case "forest": rect(ctx, x, y, T, T, p.forest[0]); break;
        case "flowers": flowersTile(ctx, rng, x, y, lifted); break;
        case "path": pathTile(ctx, rng, x, y, c, r); break;
        case "plaza": plazaTile(ctx, rng, x, y); break;
        case "water": waterTile(ctx, rng, x, y); break;
        case "waterfall": waterfallTile(ctx, rng, x, y, c, r); break;
        case "bridge": bridgeTile(ctx, x, y, c, r); break;
        case "cliff": cliffTile(ctx, rng, x, y, c, r); break;
        case "stairs": stairsTile(ctx, x, y); break;
        case "prop": {
          const base = propBaseAt(c, r);
          if (base === "plaza") plazaTile(ctx, rng, x, y);
          else if (base === "path") pathTile(ctx, rng, x, y, c, r);
          else grassTile(ctx, rng, x, y, lifted);
          break;
        }
        default: grassTile(ctx, rng, x, y, lifted); break;
      }
    }
  }
}

function propBaseAt(c: number, r: number): "plaza" | "grass" | "path" {
  if (r <= 18 && c <= 21 && c >= 2) return "plaza";
  if (r === 20 && c >= 26) return "path";
  return "grass";
}

// Forest canopy masses: overlapping crowns painted after the base tiles.
function paintForest(ctx: Ctx, rng: Rng) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (at(c, r) !== "forest") continue;
      const x = c * T;
      const y = r * T;
      // layered pine silhouettes in the deep forest
      if ((c * 5 + r * 7) % 9 === 0) {
        const px = x + 8;
        const py = y + 16;
        for (let i = 0; i < 5; i++) rect(ctx, px - 2 - i, py - 12 + i * 3, 4 + i * 2, 3, p.pine);
        rect(ctx, px - 1, py - 2, 2, 3, p.trunk);
      } else {
        const cx = x + 8 + Math.floor(rng() * 4) - 2;
        const cy = y + 8 + Math.floor(rng() * 4) - 2;
        const rad = 8 + Math.floor(rng() * 5);
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            const d = dx * dx + dy * dy;
            if (d > rad * rad) continue;
            const shade = dx * 2 - dy * 3 > rad ? p.forest[3] : dx + dy > rad ? p.forest[2] : dx - dy < -rad * 0.4 ? p.forest[1] : p.forest[0];
            pixel(ctx, cx + dx, cy + dy, rng() < 0.18 ? p.forest[2] : shade);
          }
        }
        for (let i = 0; i < 4; i++) pixel(ctx, cx - rad / 2 + i * 2, cy - rad / 2 + Math.floor(rng() * 3), p.forestLight);
      }
    }
  }
  // trunks and shadow where forest meets open ground to the south
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (at(c, r) !== "forest" || at(c, r + 1) === "forest") continue;
      const x = c * T;
      const y = r * T;
      rect(ctx, x, y + 12, T, 4, "rgba(6, 12, 9, 0.55)");
      const trunks = rng() < 0.35 ? 0 : 1 + Math.floor(rng() * 2);
      for (let i = 0; i < trunks; i++) {
        const th = 5 + Math.floor(rng() * 5);
        rect(ctx, x + 2 + Math.floor(rng() * 11), y + 16 - th, 2 + Math.floor(rng() * 2), th, p.trunk);
      }
    }
  }
}

function paintWaterEdges(ctx: Ctx, rng: Rng) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const x = c * T;
      const y = r * T;
      if (at(c, r) === "water") {
        for (const [dc, dir] of [[-1, 1], [1, -1]] as const) {
          if (!isLand(at(c + dc, r))) continue;
          const ex = dc < 0 ? x : x + 15;
          for (let i = 0; i < 16; i++) {
            if (rng() > 0.4) continue;
            pixel(ctx, ex + dir * Math.floor(rng() * 2), y + i, rng() < 0.25 ? p.foam : p.water[2]);
          }
        }
      }
      // organic plaza edge: soften where plaza meets soft ground
      if (at(c, r) === "plaza") {
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const next = at(c + dc, r + dr);
          if (next === undefined || next === "plaza" || isPathKind(next) || isWater(next)) continue;
          for (let i = 0; i < 16; i += 2) {
            if (rng() < 0.45) continue;
            const ex = dc === 0 ? x + i : x + (dc > 0 ? 15 : 0);
            const ey = dr === 0 ? y + i : y + (dr > 0 ? 15 : 0);
            pixel(ctx, ex, ey, p.grass[0]);
            if (rng() < 0.3) pixel(ctx, ex - dc, ey - dr, p.moss);
          }
        }
        for (const [dc, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
          const a = at(c + dc, r), b = at(c, r + dr);
          const soft = (k: TileKind | undefined) => k !== undefined && k !== "plaza" && !isPathKind(k) && !isWater(k);
          if (!soft(a) || !soft(b)) continue;
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j <= i; j++) {
              pixel(ctx, x + (dc > 0 ? 15 - i + j : i - j), y + (dr > 0 ? 15 - i : i), p.grass[0]);
            }
          }
        }
      }
    }
  }
}

const lily = ["..ggg..", ".ggggg.", "gggg.g.", ".ggggg.", "..ggg.."];
const duck = ["bew....", "wwwwww.", ".wwwww.", "..ww..."];
const duckColors = { w: "#e9e4d4", b: "#e2913a", e: "#0d1418" };
const mushroom = (ctx: Ctx, x: number, y: number) => {
  rect(ctx, x, y - 2, 3, 3, "#e0d4b8");
  rect(ctx, x - 1, y - 5, 5, 3, "#b8453a");
  pixel(ctx, x, y - 4, "#f0e9d8");
  pixel(ctx, x + 2, y - 3, "#f0e9d8");
};

export function paintGround(ctx: Ctx) {
  const rng = createRng(0x51de7);
  paintTiles(ctx, rng);
  paintWaterEdges(ctx, rng);
  paintForest(ctx, rng);
  // plaza emblem ~48px
  ring(ctx, 240, 222, 20, 24, p.moss);
  for (let a = 0; a < 8; a++) {
    const ex = Math.round(240 + 22 * Math.cos((a * Math.PI) / 4));
    const ey = Math.round(222 + 22 * Math.sin((a * Math.PI) / 4));
    rect(ctx, ex - 1, ey - 1, 3, 3, a % 2 ? "#5f8a52" : "#74a05e");
  }
  ellipse(ctx, 240, 222, 4, 6, "#5f8a52");
  pixel(ctx, 240, 220, "#74a05e");
  pixel(ctx, 240, 224, "#466c3d");
  // river decor
  for (const [lx, ly] of [[352, 200], [368, 264], [348, 372]] as const) {
    sprite(ctx, lx - 3, ly - 2, lily, { g: "#2d5a34" });
    pixel(ctx, lx + 2, ly - 3, p.flowers[0]);
  }
  sprite(ctx, 348, 296, duck, duckColors);
  sprite(ctx, 360, 306, duck, duckColors);
  for (const [rx, ry] of [[334, 208], [380, 152], [316, 328], [376, 348]] as const) {
    rect(ctx, rx, ry + 2, 6, 3, p.stone[1]);
    rect(ctx, rx + 1, ry, 4, 3, p.stone[0]);
    pixel(ctx, rx + 1, ry, p.moss);
    pixel(ctx, rx + 3, ry + 1, p.moss);
  }
  for (const [mx, my] of [[146, 84], [152, 88], [56, 304], [160, 352], [500, 44]] as const) mushroom(ctx, mx, my);
  // fireflies
  for (const [fx, fy] of [[60, 30], [150, 24], [40, 110], [90, 330], [120, 360], [610, 60], [620, 200], [560, 60], [420, 24], [30, 240]] as const) {
    pixel(ctx, fx, fy, "#ffe89a");
    if (rng() < 0.6) pixel(ctx, fx + 1, fy, "rgba(255, 232, 154, 0.5)");
  }
}

// Foreground: canopy overhang of forest tiles above walkable ground.
export function paintForeground(ctx: Ctx) {
  const rng = createRng(0xf07e57);
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (at(c, r) !== "forest" || !isWalkableKind(at(c, r - 1))) continue;
      const x = c * T;
      const y = r * T;
      for (let bx = -2; bx < 18; bx += 4) {
        const rad = 5 + Math.floor(rng() * 4);
        const cy = y - 2 + Math.floor(rng() * 3);
        for (let dy = -rad; dy <= 0; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            if (dx * dx + dy * dy > rad * rad || cy + dy < y - 10) continue;
            pixel(ctx, x + bx + dx, cy + dy, rng() < 0.2 ? p.forest[2] : p.forest[1]);
          }
        }
      }
      for (let i = 0; i < 5; i++) pixel(ctx, x + 2 + Math.floor(rng() * 12), y - 9 + Math.floor(rng() * 3), p.forestLight);
    }
  }
}
