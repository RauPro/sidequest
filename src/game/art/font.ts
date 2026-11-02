import { Ctx, pixel } from "./canvas";

const G = (rows: string) => rows.split("/");
export const font: Readonly<Record<string, readonly string[]>> = {
  A: G(" ### /#   #/#   #/#####/#   #/#   #/#   #"),
  B: G("#### /#   #/#   #/#### /#   #/#   #/#### "),
  C: G(" ### /#   #/#    /#    /#    /#   #/ ### "),
  D: G("#### /#   #/#   #/#   #/#   #/#   #/#### "),
  E: G("#####/#    /#    /#### /#    /#    /#####"),
  F: G("#####/#    /#    /#### /#    /#    /#    "),
  G: G(" ### /#   #/#    /#  ##/#   #/#   #/ ### "),
  H: G("#   #/#   #/#   #/#####/#   #/#   #/#   #"),
  I: G("#####/  #  /  #  /  #  /  #  /  #  /#####"),
  J: G("#####/    #/    #/    #/    #/#   #/ ### "),
  K: G("#   #/#  # /# #  /##   /# #  /#  # /#   #"),
  L: G("#    /#    /#    /#    /#    /#    /#####"),
  M: G("#   #/## ##/# # #/# # #/#   #/#   #/#   #"),
  N: G("#   #/##  #/##  #/# # #/#  ##/#  ##/#   #"),
  O: G(" ### /#   #/#   #/#   #/#   #/#   #/ ### "),
  P: G("#### /#   #/#   #/#### /#    /#    /#    "),
  Q: G(" ### /#   #/#   #/#   #/# # #/#  # / ## #"),
  R: G("#### /#   #/#   #/#### /# #  /#  # /#   #"),
  S: G(" ####/#    /#    / ### /    #/    #/#### "),
  T: G("#####/  #  /  #  /  #  /  #  /  #  /  #  "),
  U: G("#   #/#   #/#   #/#   #/#   #/#   #/ ### "),
  V: G("#   #/#   #/#   #/#   #/#   #/ # # /  #  "),
  W: G("#   #/#   #/#   #/# # #/# # #/## ##/#   #"),
  X: G("#   #/#   #/ # # /  #  / # # /#   #/#   #"),
  Y: G("#   #/#   #/ # # /  #  /  #  /  #  /  #  "),
  Z: G("#####/    #/   # /  #  / #   /#    /#####"),
};

export function textWidth(text: string) {
  return text.length * 6 - 1;
}

export function drawText(ctx: Ctx, x: number, y: number, text: string, color: string, shadow?: string) {
  if (shadow) drawText(ctx, x + 1, y + 1, text, color === shadow ? "#000000" : shadow);
  let cx = x;
  for (const ch of text.toUpperCase()) {
    if (ch === " ") { cx += 4; continue; }
    const glyph = font[ch];
    if (glyph) {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (glyph[r][c] !== " ") pixel(ctx, cx + c, y + r, color);
    }
    cx += 6;
  }
}
