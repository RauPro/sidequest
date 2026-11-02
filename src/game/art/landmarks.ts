import { Ctx, disc, glow, pixel, rect, ring, sprite } from "./canvas";
import { palette as p } from "./palette";
import { dogLook, helperLook, merchantLook, paintCharacter, seerLook } from "./characters";

const SHADOW = "rgba(8, 14, 10, 0.3)";

function roof(ctx: Ctx, cx: number, top: number, steps: readonly number[], colors: readonly [string, string]) {
  for (let i = 0; i < steps.length; i++) {
    const w = steps[i];
    const y = top + i * 3;
    rect(ctx, cx - w / 2 - 1, y - 1, w + 2, 4, p.outline);
    rect(ctx, cx - w / 2, y, w, 3, colors[0]);
    rect(ctx, cx - w / 2, y + 2, w, 1, colors[1]);
    for (let sx = -w / 2 + 2; sx < w / 2 - 1; sx += 4) pixel(ctx, cx + sx, y + 1, colors[1]);
  }
}

function window_(ctx: Ctx, x: number, y: number, w: number, h: number) {
  glow(ctx, x + Math.floor(w / 2), y + Math.floor(h / 2), Math.floor(Math.max(w, h) / 2) + 3, p.glowWarm);
  rect(ctx, x - 1, y - 1, w + 2, h + 2, p.wood[1]);
  rect(ctx, x, y, w, h, p.windowLight);
  rect(ctx, x + Math.floor(w / 2), y, 1, h, p.wood[1]);
  rect(ctx, x, y + Math.floor(h / 2), w, 1, p.wood[1]);
}

function lanternHead(ctx: Ctx, x: number, y: number) {
  glow(ctx, x + 1, y + 2, 6, p.glowWarm);
  rect(ctx, x - 1, y, 4, 4, p.outline);
  rect(ctx, x, y + 1, 2, 2, p.windowLight);
}

const figurineColors = { d: p.ember, h: "#f7d774", g: "#d96a34", s: p.slime, e: p.outline, b: p.bolt, a: "#ffd27a", f: "#3a6a80" };
const dragon = ["h...h", ".ddd.", "dgddd", ".ddd.", "d.d.d"];
const slime = [".sss.", "sssss", "se.es", "sssss"];
const robot = ["..a..", ".bbb.", "bbebb", ".bbb.", "b.b.b", ".f.f."];

export function paintMarket(ctx: Ctx) {
  rect(ctx, 102, 84, 78, 6, SHADOW);
  // walls + timber frame
  rect(ctx, 104, 46, 72, 38, p.plaster);
  for (const bx of [104, 118, 132, 146, 160, 174]) rect(ctx, bx, 46, 2, 38, p.wood[1]);
  rect(ctx, 104, 46, 72, 2, p.wood[1]);
  rect(ctx, 104, 82, 72, 2, p.wood[1]);
  roof(ctx, 140, 30, [60, 68, 76, 84, 92], p.roofSlate);
  // open counter, warm interior
  rect(ctx, 116, 60, 38, 24, "#221610");
  rect(ctx, 118, 61, 34, 15, `rgba(${p.glowWarm}, 0.18)`);
  window_(ctx, 161, 53, 9, 9);
  // awning
  for (let i = 0; i < 11; i++) rect(ctx, 113 + i * 4, 54, 4, 7, p.awning[i % 2]);
  rect(ctx, 113, 54, 44, 1, p.outline);
  for (let i = 0; i < 11; i++) rect(ctx, 113 + i * 4 + (i % 2), 61, 2, 1, p.awning[i % 2]);
  rect(ctx, 114, 61, 1, 19, p.wood[1]);
  rect(ctx, 155, 61, 1, 19, p.wood[1]);
  // counter with figurines
  rect(ctx, 116, 78, 38, 3, p.wood[0]);
  rect(ctx, 116, 81, 38, 3, p.wood[1]);
  sprite(ctx, 120, 72, dragon, figurineColors, p.outline);
  sprite(ctx, 135, 74, slime, figurineColors, p.outline);
  sprite(ctx, 147, 71, robot, figurineColors, p.outline);
  // crates + flower pots
  for (const [cx, cy] of [[96, 78], [97, 72]] as const) {
    rect(ctx, cx, cy, 7, 7, p.wood[0]);
    rect(ctx, cx, cy, 7, 1, p.wood[1]);
    rect(ctx, cx, cy + 6, 7, 1, p.wood[1]);
    rect(ctx, cx + 3, cy, 1, 7, p.wood[1]);
  }
  for (const px of [158, 164]) {
    rect(ctx, px, 80, 4, 4, p.wood[2]);
    pixel(ctx, px, 78, p.flowers[0]);
    pixel(ctx, px + 2, 79, p.flowers[1]);
  }
  paintCharacter(ctx, 170, 92, merchantLook);
}

export function paintOracle(ctx: Ctx) {
  rect(ctx, 278, 78, 34, 4, SHADOW);
  // roof cone behind tower
  roof(ctx, 295, 7, [4, 8, 14, 20, 26, 32, 38, 44, 48], p.roofPurple);
  pixel(ctx, 295, 6, "#d9a441");
  // tower
  rect(ctx, 280, 34, 30, 46, p.stone[1]);
  for (let y = 39; y < 80; y += 5) rect(ctx, 280, y, 30, 1, p.stone[0]);
  for (const [jx, jy] of [[288, 42], [298, 47], [286, 57], [296, 67], [302, 62]] as const) rect(ctx, jx, jy, 1, 4, p.stone[0]);
  rect(ctx, 278, 72, 34, 8, p.stone[0]);
  rect(ctx, 278, 72, 34, 1, p.outline);
  // slit windows
  for (const [wx, wy] of [[286, 46], [301, 57]] as const) {
    rect(ctx, wx, wy, 3, 6, p.outline);
    rect(ctx, wx + 1, wy + 1, 1, 4, p.windowLight);
  }
  // arched door with violet glow
  rect(ctx, 292, 74, 6, 6, "#241a3a");
  rect(ctx, 293, 72, 4, 2, p.stone[0]);
  rect(ctx, 294, 71, 2, 1, p.stone[0]);
  glow(ctx, 295, 77, 6, p.glowViolet);
  pixel(ctx, 295, 77, "#9d7fd6");
  // indigo banner with gold crescent
  rect(ctx, 303, 64, 7, 13, "#3a2d6e");
  rect(ctx, 303, 64, 7, 1, p.outline);
  pixel(ctx, 306, 77, "#241a3a");
  for (const [bx, by] of [[306, 68], [305, 69], [305, 70], [305, 71], [306, 72]] as const) pixel(ctx, bx, by, "#d9a441");
  // seer + crystal ball at the door
  paintCharacter(ctx, 285, 84, seerLook);
  rect(ctx, 305, 81, 2, 3, p.wood[1]);
  rect(ctx, 303, 80, 6, 1, p.wood[0]);
  glow(ctx, 306, 78, 6, p.glowViolet);
  disc(ctx, 306, 78, 2, p.water[2]);
  pixel(ctx, 305, 77, p.foam);
}

const flame = [
  "..F.F..",
  "..FFF..",
  ".FFFF..",
  ".FMFF..",
  "FMMMFF.",
  "FMCCMF.",
  "FMCMMF.",
  ".FMMF..",
  "..FF...",
];
const flameColors = { F: p.fire[2], M: p.fire[1], C: p.fire[0] };

export function paintCamp(ctx: Ctx) {
  // tent: stepped triangle, dark opening
  rect(ctx, 306, 176, 48, 4, SHADOW);
  const bands: [number, number][] = [[46, 172], [40, 168], [34, 164], [28, 160], [22, 156], [16, 152], [10, 149]];
  for (const [w, y] of bands) {
    rect(ctx, 330 - w / 2 - 1, y - 1, w + 2, 5, p.outline);
    rect(ctx, 330 - w / 2, y, Math.ceil(w * 0.6), 4, p.tent[0]);
    rect(ctx, 330 - w / 2 + Math.ceil(w * 0.6), y, Math.floor(w * 0.4), 4, p.tent[1]);
  }
  for (const [w, y] of [[14, 172], [10, 168], [6, 164]] as const) rect(ctx, 330 - w / 2, y, w, 4, "#141f12");
  rect(ctx, 329, 144, 2, 6, p.wood[1]);
  // campfire
  glow(ctx, 285, 192, 9, p.glowFire);
  ring(ctx, 285, 195, 4, 6, p.stone[1]);
  rect(ctx, 281, 194, 8, 2, p.wood[1]);
  rect(ctx, 284, 192, 2, 5, p.wood[0]);
  sprite(ctx, 281, 186, flame, flameColors);
  pixel(ctx, 279, 188, p.fire[1]);
  pixel(ctx, 292, 190, p.fire[1]);
  // log seats + helper + dog
  for (const [lx, ly] of [[268, 188], [297, 194]] as const) {
    rect(ctx, lx, ly, 7, 3, p.wood[0]);
    rect(ctx, lx, ly, 1, 3, p.wood[2]);
    rect(ctx, lx + 6, ly, 1, 3, p.wood[1]);
  }
  paintCharacter(ctx, 300, 193, helperLook);
  sprite(ctx, 342, 186, dogLook.rows, dogLook.colors, p.outline);
  // lantern pole
  rect(ctx, 355, 168, 2, 12, p.wood[1]);
  rect(ctx, 355, 166, 6, 1, p.wood[1]);
  lanternHead(ctx, 359, 167);
}

export function paintPostOffice(ctx: Ctx) {
  rect(ctx, 26, 136, 48, 4, SHADOW);
  // chimney behind roof
  rect(ctx, 64, 74, 6, 10, p.stone[1]);
  rect(ctx, 63, 72, 8, 2, p.stone[0]);
  pixel(ctx, 66, 70, "rgba(200, 200, 210, 0.5)");
  pixel(ctx, 67, 68, "rgba(200, 200, 210, 0.3)");
  // walls
  rect(ctx, 28, 96, 44, 40, p.plaster);
  rect(ctx, 28, 96, 2, 40, p.wood[1]);
  rect(ctx, 70, 96, 2, 40, p.wood[1]);
  rect(ctx, 28, 134, 44, 2, p.stone[1]);
  roof(ctx, 50, 84, [30, 38, 46, 54], p.roofRed);
  // lit window + flower box
  window_(ctx, 33, 104, 9, 9);
  rect(ctx, 33, 114, 9, 2, p.wood[1]);
  pixel(ctx, 34, 113, p.flowers[0]);
  pixel(ctx, 38, 113, p.flowers[1]);
  // door + envelope emblem
  rect(ctx, 48, 116, 14, 20, p.wood[1]);
  rect(ctx, 50, 118, 10, 18, p.wood[0]);
  rect(ctx, 52, 120, 6, 7, p.wood[2]);
  pixel(ctx, 57, 127, "#d9a441");
  rect(ctx, 46, 136, 18, 2, p.stone[1]);
  rect(ctx, 51, 109, 8, 6, "#f0e9d8");
  for (const [vx, vy] of [[51, 109], [52, 110], [53, 111], [54, 112], [55, 112], [56, 111], [57, 110], [58, 109]] as const) pixel(ctx, vx, vy, p.mailbox[1]);
  // parcels by the door
  rect(ctx, 36, 130, 7, 6, "#a8845c");
  rect(ctx, 36, 130, 7, 1, "#8a6a48");
  rect(ctx, 39, 130, 1, 6, "#8a6a48");
  rect(ctx, 44, 132, 5, 4, "#c2a078");
  rect(ctx, 44, 132, 5, 1, "#a8845c");
  // red mailbox on tile (8,13)
  rect(ctx, 83, 136, 2, 4, p.wood[1]);
  rect(ctx, 87, 136, 2, 4, p.wood[1]);
  rect(ctx, 81, 124, 9, 12, p.mailbox[0]);
  rect(ctx, 81, 124, 9, 1, p.outline);
  rect(ctx, 83, 128, 5, 6, p.mailbox[1]);
  rect(ctx, 82, 130, 7, 1, p.outline);
  rect(ctx, 83, 126, 5, 3, "#f0e9d8");
  pixel(ctx, 84, 127, p.mailbox[1]);
  pixel(ctx, 85, 128, p.mailbox[1]);
  pixel(ctx, 86, 127, p.mailbox[1]);
}

export function paintLandmarks(ctx: Ctx) {
  paintMarket(ctx);
  paintOracle(ctx);
  paintPostOffice(ctx);
  paintCamp(ctx);
}
