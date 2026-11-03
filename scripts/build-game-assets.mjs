import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = new URL("../assets/source/village/", import.meta.url);
const output = new URL("../public/game/", import.meta.url);
const sourcePath = (name) => fileURLToPath(new URL(name, source));
const outputPath = (name) => fileURLToPath(new URL(name, output));

await Promise.all([
  mkdir(outputPath(""), { recursive: true }),
  mkdir(outputPath("village"), { recursive: true }),
  mkdir(outputPath("sprites"), { recursive: true }),
  mkdir(outputPath("products"), { recursive: true }),
  mkdir(outputPath("portraits"), { recursive: true }),
  mkdir(outputPath("fx"), { recursive: true }),
]);

await sharp(sourcePath("clean-plate-v2.png"))
  .resize(1536, 1024, { fit: "fill" })
  .webp({ quality: 90, effort: 6 })
  .toFile(outputPath("village/background.webp"));

async function removeMagenta(name) {
  const { data, info } = await sharp(sourcePath(name))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const magenta = red > 200 && blue > 200 && green < 90;
      const fringe = red > 160 && blue > 160 && green < 130 && Math.abs(red - blue) < 100;

      if (magenta || fringe) data[offset + 3] = 0;
      if (data[offset + 3] > 0) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  if (right < left || bottom < top) throw new Error(`${name} has no visible content after chroma keying`);
  return {
    data,
    extract: { left, top, width: right - left + 1, height: bottom - top + 1 },
    info,
  };
}

const player = await removeMagenta("player-sheet.png");
if (player.info.width !== 1024 || player.info.height !== 1024) {
  throw new Error("player-sheet.png must be 1024×1024 with a 4×4 frame grid");
}
await sharp(player.data, { raw: { width: player.info.width, height: player.info.height, channels: 4 } })
  .resize(512, 512, { kernel: sharp.kernel.nearest, fit: "fill" })
  .png()
  .toFile(outputPath("sprites/player.png"));

for (const name of ["ember", "moss", "bolt"]) {
  const image = await removeMagenta(`product-${name}.png`);
  const { left, top, width, height } = image.extract;
  const cropped = Buffer.alloc(width * height * 4);
  for (let row = 0; row < height; row++) {
    const start = ((top + row) * image.info.width + left) * 4;
    image.data.copy(cropped, row * width * 4, start, start + width * 4);
  }
  const content = await sharp(cropped, { raw: { width, height, channels: 4 } })
    .resize({ height: 176, kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  await sharp(content)
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath(`products/${name}.png`));
}

for (const name of ["milo", "oracle", "finn", "pip"]) {
  await sharp(sourcePath(`portrait-${name}.png`))
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 90, effort: 6 })
    .toFile(outputPath(`portraits/${name}.webp`));
}

// NPC sheets: generated 4×4 sheets drift inside their nominal cells, so each
// frame is re-centred on a shared foot baseline before downscaling.
async function normalizeSheet(name, cell, output) {
  const sheet = await removeMagenta(`${name}.png`);
  const { width, height } = sheet.info;
  if (width !== 1024 || height !== 1024) throw new Error(`${name}.png must be 1024×1024 with a 4×4 frame grid`);
  const size = 256;
  const out = Buffer.alloc(width * height * 4);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let left = size, top = size, right = -1, bottom = -1;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (sheet.data[((row * size + y) * width + col * size + x) * 4 + 3]) {
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
      }
      if (right < 0) throw new Error(`${name}.png frame ${row},${col} is empty`);
      const dx = Math.round(size / 2 - (left + right + 1) / 2);
      const dy = size - 6 - (bottom + 1);
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
        const tx = x + dx, ty = y + dy;
        if (tx < 0 || ty < 0 || tx >= size || ty >= size) continue;
        const from = ((row * size + y) * width + col * size + x) * 4;
        const to = ((row * size + ty) * width + col * size + tx) * 4;
        sheet.data.copy(out, to, from, from + 4);
      }
    }
  }
  await sharp(out, { raw: { width, height, channels: 4 } })
    .resize(cell * 4, cell * 4, { kernel: cell * 4 >= 512 ? sharp.kernel.nearest : sharp.kernel.lanczos3, fit: "fill" })
    .png()
    .toFile(outputPath(output));
}

await normalizeSheet("npc-milo-sheet", 128, "sprites/npc-milo.png");
await normalizeSheet("npc-villager-sheet", 128, "sprites/npc-villager.png");
await normalizeSheet("npc-lamplighter-sheet", 128, "sprites/npc-lamplighter.png");
await normalizeSheet("duck-sheet", 64, "sprites/duck.png");

// Village FX: animated water, swaying banners/trees and y-sorted occluders,
// all cut from the clean plate so they line up with it pixel for pixel.
const fx = JSON.parse(await readFile(new URL("../src/game/world/villageFx.json", import.meta.url), "utf8"));
const plate = await sharp(sourcePath("clean-plate-v2.png")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const plateWidth = plate.info.width;
const plateHeight = plate.info.height;
const FRAMES = 8;

function bounds(polygon) {
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  const x = Math.max(0, Math.floor(Math.min(...xs)));
  const y = Math.max(0, Math.floor(Math.min(...ys)));
  return {
    x,
    y,
    width: Math.min(plateWidth, Math.ceil(Math.max(...xs))) - x,
    height: Math.min(plateHeight, Math.ceil(Math.max(...ys))) - y,
  };
}

function inside(x, y, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function pixel(x, y) {
  const cx = Math.min(plateWidth - 1, Math.max(0, x));
  const offset = (y * plateWidth + cx) * 3;
  return [plate.data[offset], plate.data[offset + 1], plate.data[offset + 2]];
}

function hsv([r, g, b]) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function isWater(rgb) {
  const { h, s, v } = hsv(rgb);
  if (v > 0.85 && s < 0.35 && rgb[2] >= rgb[0]) return true;
  return h > 0.53 && h < 0.64 && s > 0.45 && v > 0.35;
}

function isFoliage(rgb) {
  const { h, s, v } = hsv(rgb);
  return h > 0.2 && h < 0.55 && s > 0.2 && v > 0.12 && v < 0.75;
}

function hash(n) {
  let x = Math.imul(n, 374761393) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 0xffffffff;
}

async function writeStrip(name, box, frames, paint) {
  const strip = Buffer.alloc(box.width * frames * box.height * 4);
  for (let f = 0; f < frames; f++) {
    for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
      const rgba = paint(box.x + x, box.y + y, f / frames);
      if (!rgba) continue;
      const offset = (y * box.width * frames + f * box.width + x) * 4;
      strip[offset] = rgba[0];
      strip[offset + 1] = rgba[1];
      strip[offset + 2] = rgba[2];
      strip[offset + 3] = 255;
    }
  }
  await sharp(strip, { raw: { width: box.width * frames, height: box.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath(`fx/${name}.png`));
}

const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));

for (const region of fx.water) {
  const box = bounds(region.polygon);
  await writeStrip(`water-${region.id}`, box, FRAMES, (x, y, t) => {
    if (!inside(x + 0.5, y + 0.5, region.polygon)) return null;
    const rgb = pixel(x, y);
    if (!isWater(rgb)) return null;
    let k;
    if (region.kind === "fall") {
      const column = Math.floor(x / 2);
      const wavelength = 18 + 10 * hash(column + 99);
      k = 0.22 * Math.sin(2 * Math.PI * (y / wavelength - t * 2 + hash(column)));
    } else {
      k = 0.14 * Math.sin(2 * Math.PI * (y / 7 + 0.35 * Math.sin(x / 17 + y / 29) - t));
    }
    k = Math.round(Math.max(-0.25, Math.min(0.3, k)) * 8) / 8;
    const lift = k > 0 ? 18 * k : 0;
    return rgb.map((c) => clamp(c * (1 + k) + lift));
  });
}

for (const region of fx.sway) {
  const box = bounds(region.polygon);
  await writeStrip(`sway-${region.id}`, box, FRAMES, (x, y, t) => {
    if (!inside(x + 0.5, y + 0.5, region.polygon)) return null;
    const own = pixel(x, y);
    const tree = region.kind === "tree";
    if (tree && !isFoliage(own)) return null;
    const along = (y - box.y) / box.height;
    const weight = tree ? 1 - along : along;
    const dx = Math.round(region.amplitude * weight * Math.sin(2 * Math.PI * t + (tree ? x / 70 : 0)));
    return pixel(x - dx, y);
  });
}

for (const occluder of fx.occluders) {
  const box = bounds(occluder.polygon);
  await writeStrip(`occluder-${occluder.id}`, box, 1, (x, y) =>
    inside(x + 0.5, y + 0.5, occluder.polygon) ? pixel(x, y) : null);
}

console.log("Built village background, player, NPC, FX, product, and portrait assets.");
