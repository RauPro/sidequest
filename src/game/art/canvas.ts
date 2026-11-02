import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "../world/villageMap";

export const ART_SCALE = 2;
export const ART_TILE = TILE_SIZE / ART_SCALE;
export const ART_WIDTH = WORLD_WIDTH / ART_SCALE;
export const ART_HEIGHT = WORLD_HEIGHT / ART_SCALE;

export type Ctx = CanvasRenderingContext2D;
export type Rng = () => number;

export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function pixel(ctx: Ctx, x: number, y: number, color: string) {
  rect(ctx, x, y, 1, 1, color);
}

export function pick<T>(rng: Rng, options: readonly T[]): T {
  return options[Math.floor(rng() * options.length)];
}

export function disc(ctx: Ctx, cx: number, cy: number, radius: number, color: string) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) pixel(ctx, cx + dx, cy + dy, color);
    }
  }
}

export function ring(ctx: Ctx, cx: number, cy: number, inner: number, outer: number, color: string) {
  for (let dy = -outer; dy <= outer; dy++) {
    for (let dx = -outer; dx <= outer; dx++) {
      const d = dx * dx + dy * dy;
      if (d > inner * inner && d <= outer * outer) pixel(ctx, cx + dx, cy + dy, color);
    }
  }
}

// Stepped round light pool; rgb is a "r, g, b" channel list from the palette.
export function glow(ctx: Ctx, cx: number, cy: number, radius: number, rgb: string) {
  disc(ctx, cx, cy, radius, `rgba(${rgb}, 0.08)`);
  disc(ctx, cx, cy, Math.max(1, Math.round(radius * 0.6)), `rgba(${rgb}, 0.14)`);
  disc(ctx, cx, cy, Math.max(1, Math.round(radius * 0.3)), `rgba(${rgb}, 0.2)`);
}

// Pixel-map painter: each non-space character maps to a colour; an optional
// 1px outline is stamped around the silhouette first.
export function sprite(ctx: Ctx, x: number, y: number, rows: readonly string[], colors: Readonly<Record<string, string>>, outline?: string) {
  const filled = (r: number, c: number) => r >= 0 && r < rows.length && c >= 0 && c < rows[r].length && rows[r][c] !== " " && rows[r][c] !== ".";
  if (outline) {
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (filled(r, c)) continue;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (filled(r + dr, c + dc)) { pixel(ctx, x + c, y + r, outline); dr = 2; break; }
          }
        }
      }
    }
  }
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (!filled(r, c)) continue;
      const color = colors[rows[r][c]];
      if (color) pixel(ctx, x + c, y + r, color);
    }
  }
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
