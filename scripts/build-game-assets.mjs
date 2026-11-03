import { mkdir } from "node:fs/promises";
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
]);

await sharp(sourcePath("clean-plate-v1.png"))
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

console.log("Built village background, player, product, and portrait assets.");
