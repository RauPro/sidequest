import { Ctx, sprite } from "./canvas";
import { palette as p } from "./palette";

const O = p.outline;

// Player chibi, 12px wide inside a 16x24 frame. H hair, S skin, E eye,
// B tunic, T sleeve, K pack, A belt, P trousers, D boots.
const colors = {
  H: "#5a3a26", S: p.skin, E: O, s: "#e0a878", B: "#8a3242", T: "#6e2534",
  K: "#6b4a2f", k: "#54401f", A: "#2e2620", P: "#2e3242", D: "#3a2a1e",
};

const HEADS: Record<string, string[]> = {
  down: [
    "...HHHHHH...",
    "..HHHHHHHH..",
    "..HSSSSSSH..",
    "..HSESESSH..",
    "..HSSSSSSH..",
    "...SSSSSS...",
  ],
  up: [
    "...HHHHHH...",
    "..HHHHHHHH..",
    "..HHHHHHHH..",
    "..HHHHHHHH..",
    "..HHHHHHHH..",
    "...HHHHHH...",
  ],
  right: [
    "...HHHHHH...",
    "..HHHHHHHH..",
    "..HSSSSSSH..",
    "..HSSSSSSE..",
    "..HSSSSSSH..",
    "...SSSSSS...",
  ],
};

const TORSO: Record<string, string[]> = {
  down: [
    "..BBBBBBBB..",
    ".KBBBBBBBK..",
    ".TBBBBBBBT..",
    ".sBBBBBBBs..",
    "..BBBBBBBB..",
    "..AAAAAAA...",
  ],
  up: [
    "..KKKKKKKK..",
    ".KKKKKKKKK..",
    ".TkKKKKKkT..",
    ".sKKKKKKKs..",
    "..KKKKKKKK..",
    "..AAAAAAA...",
  ],
  right: [
    ".KBBBBBBB...",
    ".KKBBBBBB...",
    ".KKTBBBBTs..",
    ".KKBBBBBB...",
    ".KKBBBBBB...",
    "..AAAAAAA...",
  ],
};

const LEGS: Record<string, string[]> = {
  idle: [
    "...PPPPPP...",
    "...PPPPPP...",
    "...PP.PPP...",
    "...DD.DDD...",
  ],
  a: [
    "..PPPPP.....",
    "..PP..PP....",
    "..PP...PP...",
    "..DD...DD...",
  ],
  b: [
    ".....PPPPP..",
    "....PP..PP..",
    "...PP...PP..",
    "...DD...DD..",
  ],
};

function paintPlayerFrame(ctx: Ctx, x: number, y: number, dir: "down" | "up" | "right", pose: "idle" | "a" | "b") {
  sprite(ctx, x, y, [...HEADS[dir], ...TORSO[dir], ...LEGS[pose]], colors, O);
}

// 3 directions x 3 poses: frames 0-2 down, 3-5 up, 6-8 right (idle, stepA, stepB).
export function paintPlayerSheet(ctx: Ctx) {
  const dirs = ["down", "up", "right"] as const;
  const poses = ["idle", "a", "b"] as const;
  for (const [r, dir] of dirs.entries()) {
    for (const [c, pose] of poses.entries()) {
      paintPlayerFrame(ctx, c * 16 + 2, r * 24 + 8, dir, pose);
    }
  }
}
