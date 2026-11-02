import { Ctx, sprite } from "./canvas";
import { palette as p } from "./palette";

export type CharacterLook = { rows: readonly string[]; colors: Readonly<Record<string, string>> };

// Foot anchor at bottom centre (x, y). Shared chibi proportions with a 1px outline.
export function paintCharacter(ctx: Ctx, x: number, y: number, look: CharacterLook) {
  sprite(ctx, x - Math.floor(look.rows[0].length / 2), y - look.rows.length, look.rows, look.colors, p.outline);
}

const skinTones = { S: p.skin, E: p.outline, P: "#4b4a55", D: "#2e2620", A: "#4a3323" };

export const visitorLook: CharacterLook = {
  rows: [
    ".HHHHH. ",
    "HHHHHHH ",
    "HSSSSSH ",
    "HSESESH ",
    ".SSSSS. ",
    ".BBBBB. ",
    "TBBBBBTK",
    "TBBBBBTK",
    "sBBBBBsK",
    ".ABBBA. ",
    ".PP.PP. ",
    ".PP.PP. ",
    ".DD.DD. ",
  ],
  colors: { ...skinTones, s: "#e0a878", H: "#5a3a26", B: "#3f6fa8", T: "#33588a", K: "#b03a2e" },
};

export const merchantLook: CharacterLook = {
  rows: [
    "...F...",
    "..FFF..",
    ".HHHHH.",
    "HHHHHHH",
    ".SSSSS.",
    ".SESES.",
    ".RRRRR.",
    ".BBBBB.",
    "TBAAABT",
    "TBAAABT",
    "sBAAABs",
    ".PP.PP.",
    ".DD.DD.",
  ],
  colors: { ...skinTones, s: "#e0a878", F: "#8fae63", H: "#3f6b3a", R: "#5a3a26", B: "#6b4a32", T: "#57392a", A: "#e9e4d4" },
};

export const seerLook: CharacterLook = {
  rows: [
    "..HHH..",
    ".HHHHH.",
    "HHHHHHH",
    "HHSSSHH",
    "HHSESHH",
    ".HHHHH.",
    ".BBBBB.",
    "TBBBBBT",
    "TBBBBBT",
    "sBABABs",
    ".BBBBB.",
    ".BBBBB.",
    ".DDDDD.",
  ],
  colors: { ...skinTones, s: "#c8a06a", E: "#ffd27a", H: "#3f3270", B: "#5d4a9c", T: "#4a3a80", A: "#d9a441", D: "#2e2450" },
};

export const helperLook: CharacterLook = {
  rows: [
    ".HHHHH.",
    "HHHHHHH",
    ".SSSSS.",
    ".SESES.",
    ".BBBBB.",
    "TBBBBBT",
    "sBBBBBs",
    "PPPPPP.",
    "DDDDD..",
  ],
  colors: { ...skinTones, s: "#e0a878", H: "#4f6b38", B: "#8a6a48", T: "#6e523a" },
};

export const dogLook: CharacterLook = {
  rows: [
    "TDDDD..",
    "DDDDDD.",
    "DDDDDHH",
    "DDDDDEH",
  ],
  colors: { D: "#b08a5a", T: "#8a6a48", H: "#8a6a48", E: p.outline },
};
