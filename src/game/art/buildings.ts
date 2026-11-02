import { Ctx, ellipse, pixel, rect, sprite } from "./canvas";
import { drawText, textWidth } from "./font";
import { palette as p } from "./palette";

const O = p.outline;

function signboard(ctx: Ctx, cx: number, y: number, text: string) {
  const w = textWidth(text) + 8;
  rect(ctx, cx - w / 2 - 1, y - 1, w + 2, 12, O);
  rect(ctx, cx - w / 2, y, w, 10, p.wood[0]);
  rect(ctx, cx - w / 2, y, w, 1, p.wood[2]);
  rect(ctx, cx - w / 2, y + 9, w, 1, p.wood[1]);
  pixel(ctx, cx - w / 2 + 2, y + 2, p.wood[1]);
  pixel(ctx, cx + w / 2 - 3, y + 2, p.wood[1]);
  drawText(ctx, cx - textWidth(text) / 2, y + 2, text, "#f0e2c4", "#1b120c");
}

// sloped roof: stacked bands widening downward, shingle notches
function roof(ctx: Ctx, cx: number, top: number, widths: readonly number[], rowH: number, ramp: readonly [string, string, string]) {
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    const y = top + i * rowH;
    rect(ctx, cx - w / 2 - 1, y - 1, w + 2, rowH + 2, O);
    rect(ctx, cx - w / 2, y, w, rowH + 1, ramp[0]);
    rect(ctx, cx - w / 2, y, w, 1, ramp[2]);
    rect(ctx, cx - w / 2, y + rowH, w, 1, ramp[1]);
    for (let sx = -w / 2 + ((i % 2) ? 3 : 0); sx < w / 2 - 2; sx += 6) rect(ctx, cx + sx, y + 2, 1, rowH - 1, ramp[1]);
  }
}

function litWindow(ctx: Ctx, x: number, y: number, w: number, h: number, shutters = false) {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, O);
  rect(ctx, x - 1, y - 1, w + 2, h + 2, p.timber[1]);
  rect(ctx, x, y, w, h, p.windowLight);
  rect(ctx, x + Math.floor(w / 2), y, 1, h, p.timber[1]);
  rect(ctx, x, y + Math.floor(h / 2), w, 1, p.timber[1]);
  rect(ctx, x - 2, y + h, w + 4, 2, p.wood[1]);
  if (shutters) {
    rect(ctx, x - 4, y - 1, 3, h + 2, p.wood[1]);
    rect(ctx, x + w + 1, y - 1, 3, h + 2, p.wood[1]);
  }
}

function flowerBox(ctx: Ctx, x: number, y: number, w: number) {
  rect(ctx, x, y, w, 3, p.wood[1]);
  rect(ctx, x, y, w, 1, p.wood[2]);
  for (let i = 1; i < w - 1; i += 3) {
    pixel(ctx, x + i, y - 2, i % 2 ? "#d0553f" : "#e58fb0");
    pixel(ctx, x + i + 1, y - 1, p.moss);
  }
}

function lantern(ctx: Ctx, x: number, y: number) {
  rect(ctx, x - 1, y, 4, 5, O);
  rect(ctx, x, y + 1, 2, 3, p.lanternGlass);
  pixel(ctx, x + 1, y - 1, O);
}

const figurines = {
  d: p.ember, h: "#f7d774", g: "#d96a34", s: p.slime, e: O, b: p.bolt, a: "#ffd27a", f: "#3a6a80", k: "#8a5a3a",
};
const dragon = [
  "..h....h..",
  "..d...d...",
  "...ddd....",
  "..ddddd...",
  ".dgddddd..",
  "dg.ddddd..",
  "..ded.d...",
  "..ddddd...",
  ".dddd.dd..",
  "..d...d...",
];
const slime = [
  "....ss....",
  "...ssss...",
  "..ssssss..",
  "..se..es..",
  ".ssssssss.",
  "ssssssssss",
  "ssssssssss",
  ".ssssssss.",
  "..ssssss..",
];
const robot = [
  "....aa....",
  "...bbbb...",
  "..bbbbbb..",
  "..bebb eb..".replace(" ", "b"),
  "..bbbbbb..",
  "...bbbb...",
  "..b.bb.b..",
  ".bbb..bbb.",
  "..b....b..",
  "..ff..ff..",
];

function paintMarket(ctx: Ctx) {
  // W=160 H=136, base at bottom
  roof(ctx, 80, 8, [96, 112, 126, 138, 148, 156, 160, 160, 160], 7, p.roofSlate);
  // moonlit ridge highlight
  rect(ctx, 33, 8, 94, 1, "#7a92b5");
  for (let i = 0; i < 4; i++) rect(ctx, 36 + i * 22, 9 + i * 2, 14, 1, "rgba(140,160,190,0.35)");
  // front wall
  rect(ctx, 14, 64, 132, 70, p.plaster);
  rect(ctx, 14, 64, 132, 70, "rgba(0,0,0,0)");
  for (const bx of [14, 30, 66, 108, 142]) rect(ctx, bx, 64, 4, 70, p.timber[0]);
  rect(ctx, 14, 64, 132, 4, p.timber[0]);
  rect(ctx, 14, 130, 132, 4, p.timber[0]);
  rect(ctx, 140, 64, 6, 70, "rgba(30,20,10,0.25)");
  // storefront opening
  rect(ctx, 36, 80, 60, 50, O);
  rect(ctx, 38, 82, 56, 48, "#1c1109");
  rect(ctx, 38, 82, 56, 30, `rgba(${p.glowWarm}, 0.22)`);
  // awning
  for (let i = 0; i < 9; i++) {
    const ax = 30 + i * 8;
    rect(ctx, ax - 1, 68, 10, 12, O);
    rect(ctx, ax, 69, 8, 10, p.awning[i % 2]);
    rect(ctx, ax, 77, 8, 2, p.awning[i % 2]);
    rect(ctx, ax + 1, 79, 6, 2, p.awning[i % 2]);
  }
  signboard(ctx, 66, 55, "MARKET");
  lantern(ctx, 31, 81);
  lantern(ctx, 99, 81);
  // counter + figurines
  rect(ctx, 38, 112, 56, 4, p.wood[2]);
  rect(ctx, 38, 116, 56, 14, p.wood[0]);
  for (let i = 0; i < 5; i++) rect(ctx, 40 + i * 11, 118, 1, 12, p.wood[1]);
  sprite(ctx, 42, 100, dragon, figurines, O);
  sprite(ctx, 62, 103, slime, figurines, O);
  sprite(ctx, 78, 100, robot, figurines, O);
  // side window + flower box
  litWindow(ctx, 114, 78, 16, 14, true);
  flowerBox(ctx, 112, 96, 20);
  // side door
  rect(ctx, 114, 104, 18, 26, O);
  rect(ctx, 115, 105, 16, 25, p.wood[0]);
  rect(ctx, 117, 107, 12, 9, p.wood[1]);
  rect(ctx, 117, 118, 12, 10, p.wood[1]);
  pixel(ctx, 128, 117, "#d9a441");
  rect(ctx, 112, 130, 22, 3, p.stone[1]);
  // crates at left base
  rect(ctx, 18, 120, 12, 12, O);
  rect(ctx, 19, 121, 10, 11, p.wood[0]);
  rect(ctx, 19, 121, 10, 1, p.wood[1]);
  rect(ctx, 23, 121, 1, 11, p.wood[1]);
  ellipse(ctx, 27, 116, 5, 4, O);
  ellipse(ctx, 27, 116, 4, 3, p.wood[0]);
  rect(ctx, 24, 112, 7, 2, p.wood[2]);
}

function paintOracle(ctx: Ctx) {
  // W=96 H=132, base at bottom; cone rises to y≈4
  roof(ctx, 48, 8, [10, 18, 28, 38, 48, 58, 68, 78, 86], 5, p.roofPurple);
  pixel(ctx, 48, 5, "#e8c66a");
  pixel(ctx, 48, 4, "#e8c66a");
  rect(ctx, 47, 6, 3, 3, "#d9a441");
  // tower body, cylindrical shading
  rect(ctx, 22, 52, 52, 76, p.stone[1]);
  rect(ctx, 22, 52, 6, 76, "rgba(10,10,18,0.35)");
  rect(ctx, 66, 52, 8, 76, "rgba(10,10,18,0.45)");
  rect(ctx, 34, 52, 22, 76, "rgba(200,200,220,0.12)");
  for (let y = 58; y < 128; y += 7) {
    rect(ctx, 22, y, 52, 1, p.stone[0]);
    for (let x = 24 + ((y / 7) % 2) * 8; x < 72; x += 16) rect(ctx, x, y - 6, 1, 6, p.stone[0]);
  }
  rect(ctx, 20, 50, 56, 3, p.stone[0]);
  // windows
  for (const [wx, wy] of [[32, 66], [56, 86], [40, 100]] as const) {
    rect(ctx, wx, wy, 5, 8, O);
    rect(ctx, wx + 1, wy + 1, 3, 6, p.windowLight);
  }
  // banner with crescent
  rect(ctx, 62, 78, 11, 24, O);
  rect(ctx, 63, 79, 9, 22, "#35286e");
  pixel(ctx, 66, 101, "#241a3a");
  for (const [bx, by] of [[66, 84], [65, 85], [65, 86], [65, 87], [66, 88], [67, 85], [67, 87]] as const) pixel(ctx, bx, by, "#d9a441");
  // arched door with violet glow
  rect(ctx, 40, 108, 16, 20, O);
  rect(ctx, 42, 110, 12, 18, "#241a3a");
  rect(ctx, 43, 106, 10, 4, p.stone[0]);
  rect(ctx, 45, 104, 6, 2, p.stone[0]);
  rect(ctx, 44, 110, 8, 18, `rgba(${p.glowViolet}, 0.35)`);
  pixel(ctx, 48, 120, "#b99ae6");
  signboard(ctx, 48, 92, "ORACLE");
  // plinth steps
  rect(ctx, 18, 126, 60, 4, p.stone[0]);
  rect(ctx, 16, 129, 64, 3, p.stone[1]);
}

function paintPostOffice(ctx: Ctx) {
  // W=112 H=150, base at bottom
  rect(ctx, 76, 30, 12, 34, p.stone[1]);
  rect(ctx, 74, 28, 16, 3, p.stone[0]);
  pixel(ctx, 80, 24, "rgba(190,190,205,0.55)");
  pixel(ctx, 82, 21, "rgba(190,190,205,0.4)");
  pixel(ctx, 79, 18, "rgba(190,190,205,0.25)");
  roof(ctx, 56, 26, [36, 50, 62, 74, 84, 94, 102, 106], 7, p.roofRed);
  // walls
  rect(ctx, 12, 80, 88, 66, p.plaster);
  rect(ctx, 88, 80, 12, 66, "rgba(30,20,10,0.22)");
  rect(ctx, 12, 80, 4, 66, p.timber[0]);
  rect(ctx, 96, 80, 4, 66, p.timber[0]);
  rect(ctx, 12, 80, 88, 4, p.timber[0]);
  rect(ctx, 12, 142, 88, 4, p.stone[1]);
  // ivy
  for (const [ix, iy] of [[18, 92], [20, 98], [17, 104], [21, 110], [19, 118], [22, 88]] as const) pixel(ctx, ix, iy, p.moss);
  // two lit windows
  litWindow(ctx, 24, 96, 16, 14, true);
  litWindow(ctx, 74, 96, 16, 14, true);
  flowerBox(ctx, 22, 114, 20);
  // arched door at col 4 -> sprite x 56
  rect(ctx, 52, 112, 20, 34, O);
  rect(ctx, 54, 114, 16, 32, p.wood[0]);
  rect(ctx, 54, 110, 16, 4, p.stone[0]);
  rect(ctx, 57, 108, 10, 2, p.stone[0]);
  rect(ctx, 56, 116, 12, 12, p.wood[1]);
  rect(ctx, 56, 131, 12, 13, p.wood[1]);
  pixel(ctx, 68, 127, "#d9a441");
  rect(ctx, 50, 144, 24, 3, p.stone[1]);
  // envelope emblem above the door
  rect(ctx, 55, 98, 14, 9, O);
  rect(ctx, 56, 99, 12, 7, "#f0e9d8");
  for (const [vx, vy] of [[56, 99], [57, 100], [58, 101], [59, 102], [60, 103], [61, 103], [62, 102], [63, 101], [64, 100], [65, 99]] as const) pixel(ctx, vx, vy, p.mailbox[1]);
}

function paintCamp(ctx: Ctx) {
  // W=100 H=80, base at bottom
  const bands: [number, number][] = [[88, 68], [78, 60], [66, 52], [54, 44], [42, 36], [30, 28], [18, 20]];
  for (const [w, y] of bands) {
    rect(ctx, 50 - w / 2 - 1, y - 1, w + 2, 10, O);
    rect(ctx, 50 - w / 2, y, Math.ceil(w * 0.58), 9, p.tent[0]);
    rect(ctx, 50 - w / 2 + Math.ceil(w * 0.58), y, Math.floor(w * 0.42), 9, p.tent[1]);
  }
  // green tarp over the ridge
  for (const [w, y] of [[26, 18], [18, 12], [10, 6]] as const) {
    rect(ctx, 50 - w / 2 - 1, y - 1, w + 2, 9, O);
    rect(ctx, 50 - w / 2, y, w, 8, p.tentGreen[0]);
    rect(ctx, 50 - w / 2 + Math.ceil(w * 0.55), y, Math.floor(w * 0.45), 8, p.tentGreen[1]);
  }
  rect(ctx, 48, 2, 4, 6, p.wood[1]);
  // opening with warm interior
  for (const [w, y] of [[22, 66], [16, 58], [10, 50], [5, 42]] as const) {
    rect(ctx, 50 - w / 2, y, w, y === 66 ? 12 : 8, "#140d07");
  }
  rect(ctx, 42, 58, 16, 16, `rgba(${p.glowWarm}, 0.25)`);
  rect(ctx, 45, 66, 10, 8, `rgba(${p.glowWarm}, 0.35)`);
  pixel(ctx, 50, 68, p.fire[0]);
  // flap tied back
  rect(ctx, 56, 56, 4, 18, p.tent[1]);
  // guy ropes + stakes
  for (let i = 0; i < 6; i++) {
    pixel(ctx, 44 - i * 4, 14 + i * 10, "#c9a66b");
    pixel(ctx, 56 + i * 4, 14 + i * 10, "#c9a66b");
  }
  pixel(ctx, 18, 76, p.wood[1]);
  pixel(ctx, 82, 76, p.wood[1]);
}

export const buildingSprites = [
  { key: "bld-market", width: 160, height: 136, paint: paintMarket },
  { key: "bld-oracle", width: 96, height: 132, paint: paintOracle },
  { key: "bld-post", width: 112, height: 150, paint: paintPostOffice },
  { key: "bld-camp", width: 100, height: 80, paint: paintCamp },
];
