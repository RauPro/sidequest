import { Ctx, disc, ellipse, pixel, rect, sprite } from "./canvas";
import { drawText, textWidth } from "./font";
import { palette as p } from "./palette";

const O = p.outline;
const skinTones = { S: p.skin, E: O, s: "#e0a878", P: "#2e3242", D: "#3a2a1e", A: "#4a3323" };

function paintMerchant(ctx: Ctx) {
  sprite(ctx, 2, 0, [
    ".....FF.....",
    "....FFF.....",
    "..HHHHHHHH..",
    ".HHHHHHHHHH.",
    "..SSSSSSSS..",
    "..SESSSSES..",
    "..SSSSSSSS..",
    "...RRRRRR...",
    "..BBBBBBBB..",
    ".TBAAAAAABT.",
    ".sBAAAAAABs.",
    "..BAAAAAAB..",
    "...PPPPPP...",
    "...PPPPPP...",
    "...DD.DD....",
    "...DD.DD....",
  ], { ...skinTones, F: "#8fae63", H: "#3f6b3a", R: "#5a3a26", B: "#6b4a32", T: "#57392a", A: "#e9e4d4" }, O);
}

function paintSeerTable(ctx: Ctx) {
  // hooded seer behind a draped table with crystal ball and candles
  sprite(ctx, 14, 0, [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HHSSSSHH.",
    ".HHSESEHH.",
    "..HHHHHH..",
    "..BBBBBB..",
    ".TBBBBBBT.",
    ".sBABBABs.",
  ], { ...skinTones, E: "#ffd27a", H: "#3f3270", B: "#5d4a9c", T: "#4a3a80", A: "#d9a441" }, O);
  // table
  rect(ctx, 6, 16, 28, 3, O);
  rect(ctx, 7, 17, 26, 2, "#4a3560");
  rect(ctx, 8, 19, 24, 10, "#3a2a52");
  rect(ctx, 8, 19, 24, 2, "#57427a");
  rect(ctx, 12, 20, 1, 9, "#2e2144");
  rect(ctx, 27, 20, 1, 9, "#2e2144");
  // crystal ball + stand
  rect(ctx, 19, 13, 4, 3, O);
  disc(ctx, 21, 11, 3, "#8fd0e8");
  pixel(ctx, 20, 10, "#eaf7ff");
  pixel(ctx, 21, 12, "#58a3d6");
  // candles
  for (const cx of [10, 31]) {
    rect(ctx, cx, 10, 2, 6, "#e9e4d4");
    pixel(ctx, cx, 8, p.fire[0]);
    pixel(ctx, cx, 9, p.fire[1]);
  }
}

function sign(ctx: Ctx, w: number, text: string) {
  rect(ctx, 2, 0, w, 10, O);
  rect(ctx, 3, 1, w - 2, 8, p.wood[0]);
  rect(ctx, 3, 1, w - 2, 1, p.wood[2]);
  drawText(ctx, 3 + (w - 2 - textWidth(text)) / 2, 2, text, "#f0e2c4", "#1b120c");
}

function paintPostSign(ctx: Ctx) {
  rect(ctx, 18, 9, 3, 21, p.wood[1]);
  sign(ctx, 36, "POST");
  rect(ctx, 15, 14, 8, 6, O);
  rect(ctx, 16, 15, 6, 4, "#f0e9d8");
  for (const [vx, vy] of [[16, 15], [17, 16], [18, 17], [19, 17], [20, 16], [21, 15]] as const) pixel(ctx, vx, vy, p.mailbox[1]);
}

function paintMailbox(ctx: Ctx) {
  rect(ctx, 4, 14, 2, 6, O);
  rect(ctx, 8, 14, 2, 6, O);
  rect(ctx, 2, 2, 12, 13, O);
  rect(ctx, 3, 3, 10, 11, p.mailbox[0]);
  rect(ctx, 4, 6, 8, 6, p.mailbox[1]);
  rect(ctx, 3, 7, 10, 1, O);
  rect(ctx, 4, 4, 8, 4, "#f0e9d8");
  for (const [vx, vy] of [[4, 4], [5, 5], [6, 6], [7, 7], [8, 6], [9, 5], [10, 5], [11, 4]] as const) pixel(ctx, vx, vy, p.mailbox[1]);
}

function paintCatCrate(ctx: Ctx) {
  rect(ctx, 3, 9, 14, 11, O);
  rect(ctx, 4, 10, 12, 10, p.wood[0]);
  rect(ctx, 4, 10, 12, 1, p.wood[1]);
  rect(ctx, 4, 19, 12, 1, p.wood[1]);
  rect(ctx, 9, 10, 1, 10, p.wood[1]);
  sprite(ctx, 4, 0, [
    "cc....cc",
    "cccccccc",
    "cweccwec",
    "cccccccc",
    ".cccccc.",
    ".cccccc.",
    "ccc.ccc.",
  ], { c: "#e9e4d4", w: "#d8cbb0", e: O }, O);
}

function paintCampSign(ctx: Ctx) {
  rect(ctx, 18, 9, 3, 21, p.wood[1]);
  sign(ctx, 38, "CAMP");
  for (const [fx, fy] of [[16, 18], [18, 15], [18, 16], [17, 17], [19, 17], [17, 19], [19, 19], [18, 18]] as const) {
    pixel(ctx, fx, fy, fy < 17 ? p.fire[0] : fy === 17 ? p.fire[1] : p.fire[2]);
  }
}

function paintLogSeat(ctx: Ctx) {
  rect(ctx, 0, 1, 22, 7, O);
  rect(ctx, 1, 2, 20, 5, p.wood[0]);
  rect(ctx, 1, 2, 2, 5, p.wood[2]);
  rect(ctx, 19, 2, 2, 5, p.wood[1]);
  pixel(ctx, 5, 4, p.wood[1]);
  pixel(ctx, 12, 3, p.wood[1]);
  pixel(ctx, 16, 5, p.wood[1]);
}

function paintCampfire(ctx: Ctx) {
  const ring = [[4, 13], [8, 15], [13, 15], [17, 13], [18, 10], [15, 12], [9, 12], [3, 10]];
  for (const [sx, sy] of ring) {
    rect(ctx, sx - 1, sy - 1, 5, 4, O);
    rect(ctx, sx, sy, 3, 3, p.stone[0]);
  }
  rect(ctx, 6, 11, 12, 3, "#1a0f08");
  rect(ctx, 6, 12, 10, 2, p.wood[1]);
  rect(ctx, 9, 10, 2, 5, p.wood[0]);
  rect(ctx, 14, 10, 2, 5, p.wood[1]);
  sprite(ctx, 5, 0, [
    "...F.F...",
    "...FFF...",
    "..FMMM...",
    ".FMMMFF.",
    "FMMCMMF.",
    "FMCCCMF.",
    "FMMMCMF.",
    ".FMMMF..",
    "..FFF...",
  ], { F: p.fire[2], M: p.fire[1], C: p.fire[0] });
}

function paintCampKid(ctx: Ctx) {
  sprite(ctx, 1, 0, [
    "..HHHHH..",
    ".HHHHHHH.",
    ".SSSSSSS.",
    ".SESSSES.",
    ".SSSSSSS.",
    "..BBBBB..",
    ".TBBBBBT.",
    "TsBBBBBsT",
    ".PPPPPPM.",
    "PPPPPPPM.",
    "DDDDDDDD.",
  ], { ...skinTones, H: "#4f6b38", B: "#8a6a48", T: "#6e523a", M: "#d9a441" }, O);
}

function paintDog(ctx: Ctx) {
  sprite(ctx, 0, 0, [
    "TDDDDD....",
    "DDDDDDD...",
    "DDDDDDDHHH",
    "DDDDDDEHD.",
    ".DDDDDDDD.",
  ], { D: "#c28a52", T: "#8a6a48", H: "#8a6a48", E: O }, O);
}

function paintOwl(ctx: Ctx) {
  rect(ctx, 0, 9, 14, 2, p.trunk);
  sprite(ctx, 3, 0, [
    "T..T",
    "TTTT",
    "TYTY",
    "TTTT",
    "TBBT",
    ".TT.",
  ], { T: "#4a3423", Y: "#ffd27a", B: "#6b4a32" }, O);
}

function paintLantern(ctx: Ctx) {
  rect(ctx, 4, 6, 2, 14, O);
  rect(ctx, 4, 6, 2, 14, p.wood[1]);
  rect(ctx, 4, 4, 6, 2, O);
  rect(ctx, 4, 4, 6, 1, p.wood[1]);
  rect(ctx, 7, 4, 5, 5, O);
  rect(ctx, 8, 5, 3, 3, p.lanternGlass);
  pixel(ctx, 9, 6, "#fff3c4");
}

function paintBridgeRail(ctx: Ctx, w: number) {
  for (const px of [0, w / 2 - 1, w - 2]) {
    rect(ctx, px, 0, 3, 9, O);
    rect(ctx, px, 1, 2, 8, p.wood[1]);
  }
  rect(ctx, 0, 3, w, 2, O);
  rect(ctx, 0, 3, w, 1, p.wood[0]);
  for (let x = 2; x < w - 2; x++) pixel(ctx, x, 6 + (x % 4 === 0 ? 1 : 0), "#c9a66b");
}

function paintBarrel(ctx: Ctx) {
  ellipse(ctx, 6, 7, 6, 7, O);
  ellipse(ctx, 6, 7, 5, 6, p.wood[0]);
  rect(ctx, 1, 5, 10, 1, p.iron);
  rect(ctx, 1, 9, 10, 1, p.iron);
  rect(ctx, 5, 2, 2, 11, p.wood[2]);
}

function paintCrate(ctx: Ctx) {
  rect(ctx, 0, 0, 12, 12, O);
  rect(ctx, 1, 1, 10, 10, p.wood[0]);
  rect(ctx, 1, 1, 10, 1, p.wood[1]);
  rect(ctx, 1, 10, 10, 1, p.wood[1]);
  rect(ctx, 5, 1, 1, 10, p.wood[1]);
}

function paintPot(ctx: Ctx) {
  rect(ctx, 1, 4, 7, 6, O);
  rect(ctx, 2, 5, 5, 5, "#a86a48");
  rect(ctx, 2, 4, 5, 1, "#c08058");
  pixel(ctx, 3, 2, "#d0553f");
  pixel(ctx, 5, 1, "#e58fb0");
  pixel(ctx, 4, 3, p.moss);
}

function paintStump(ctx: Ctx) {
  ellipse(ctx, 7, 5, 7, 5, O);
  ellipse(ctx, 7, 4, 6, 4, p.wood[2]);
  ellipse(ctx, 7, 4, 3, 2, p.wood[0]);
  rect(ctx, 1, 5, 12, 4, p.wood[0]);
  rect(ctx, 1, 5, 12, 1, p.wood[1]);
}

export const propSprites = [
  { key: "merchant", width: 15, height: 17, paint: paintMerchant },
  { key: "oracle-table", width: 40, height: 30, paint: paintSeerTable },
  { key: "post-sign", width: 38, height: 31, paint: paintPostSign },
  { key: "mailbox", width: 14, height: 20, paint: paintMailbox },
  { key: "cat-crate", width: 18, height: 20, paint: paintCatCrate },
  { key: "camp-sign", width: 40, height: 31, paint: paintCampSign },
  { key: "log-seat", width: 22, height: 8, paint: paintLogSeat },
  { key: "campfire", width: 22, height: 18, paint: paintCampfire },
  { key: "camp-kid", width: 12, height: 12, paint: paintCampKid },
  { key: "dog", width: 12, height: 6, paint: paintDog },
  { key: "owl", width: 14, height: 12, paint: paintOwl },
  { key: "lantern", width: 13, height: 21, paint: paintLantern },
  { key: "bridge-rail-upper", width: 54, height: 10, paint: (ctx: Ctx) => paintBridgeRail(ctx, 54) },
  { key: "bridge-rail-lower", width: 70, height: 10, paint: (ctx: Ctx) => paintBridgeRail(ctx, 70) },
  { key: "barrel", width: 13, height: 15, paint: paintBarrel },
  { key: "crate", width: 12, height: 12, paint: paintCrate },
  { key: "pot", width: 9, height: 10, paint: paintPot },
  { key: "stump", width: 14, height: 10, paint: paintStump },
];
