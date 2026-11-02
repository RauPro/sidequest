import { Ctx, Rng, glow, pick, pixel, rect, sprite } from "./canvas";
import { palette as p } from "./palette";

function lanternPost(ctx: Ctx, x: number, y: number) {
  glow(ctx, x + 1, y - 10, 7, p.glowWarm);
  rect(ctx, x, y - 9, 2, 9, p.wood[1]);
  rect(ctx, x - 1, y - 12, 4, 4, p.outline);
  rect(ctx, x, y - 11, 2, 2, p.windowLight);
  pixel(ctx, x + 1, y - 13, p.outline);
}

function flowerBed(ctx: Ctx, rng: Rng, x: number, y: number, w: number, h: number) {
  for (let i = 0; i < w * h / 14; i++) {
    const fx = x + Math.floor(rng() * w);
    const fy = y + Math.floor(rng() * h);
    pixel(ctx, fx, fy, p.grass[1]);
    pixel(ctx, fx, fy - 1, pick(rng, p.flowers));
  }
}

function rocks(ctx: Ctx, x: number, y: number) {
  rect(ctx, x, y + 2, 4, 2, p.stone[1]);
  rect(ctx, x + 1, y + 1, 2, 1, p.stone[0]);
  rect(ctx, x + 4, y + 3, 3, 1, p.stone[1]);
}

const duck = ["bew...", "wwwwww", ".wwww."];
const duckColors = { w: "#e9e4d4", b: "#e2913a", e: p.outline };

const owl = ["T...T", "TTTTT", "TYTYT", "TTTTT", ".TTT."];
const owlColors = { T: "#4a3423", Y: "#ffd27a" };

export function paintGroundDecor(ctx: Ctx, rng: Rng) {
  flowerBed(ctx, rng, 191, 102, 8, 36);
  flowerBed(ctx, rng, 101, 171, 18, 8);
  flowerBed(ctx, rng, 221, 46, 8, 14);
  rocks(ctx, 192, 113);
  rocks(ctx, 232, 163);
  rocks(ctx, 192, 173);
  sprite(ctx, 203, 195, duck, duckColors);
  sprite(ctx, 212, 205, duck, duckColors);
  pixel(ctx, 200, 197, p.water[2]);
  pixel(ctx, 209, 207, p.water[2]);
}

export function paintStandingDecor(ctx: Ctx, rng: Rng) {
  lanternPost(ctx, 194, 80);
  lanternPost(ctx, 226, 98);
  lanternPost(ctx, 205, 138);
  lanternPost(ctx, 234, 138);
  lanternPost(ctx, 95, 98);
  lanternPost(ctx, 186, 108);
  lanternPost(ctx, 95, 168);
  lanternPost(ctx, 186, 168);
  rect(ctx, 22, 176, 10, 1, p.trunk);
  sprite(ctx, 24, 170, owl, owlColors);
  for (const [mx, my] of [[82, 55], [87, 57]] as const) {
    rect(ctx, mx, my - 1, 2, 2, "#e9e4d4");
    rect(ctx, mx - 1, my - 3, 4, 2, "#c8453a");
    pixel(ctx, mx, my - 3, "#f0e9d8");
    pixel(ctx, mx + 2, my - 2, "#f0e9d8");
  }
  for (const [fx, fy] of [[26, 36], [64, 28], [16, 196], [50, 226], [385, 90], [390, 200], [150, 15], [330, 240], [356, 56]] as const) {
    pixel(ctx, fx, fy, "#ffe89a");
    if (rng() < 0.5) pixel(ctx, fx + 1, fy, "rgba(255, 232, 154, 0.5)");
  }
}
