import { mkdir } from "node:fs/promises";
import sharp from "sharp";
import { illustrations } from "../src/features/products/illustrations.ts";

const destination = new URL("../public/images/products/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const [id, rectangles] of Object.entries(illustrations)) {
  const shapes = rectangles.map(([x, y, width, height, fill]) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`,
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#f4ead4"/><rect x="12" y="57" width="43" height="3" fill="#0c191b"/>${shapes}</svg>`;
  await sharp(Buffer.from(svg)).resize(512, 512, { kernel: "nearest" }).png()
    .toFile(new URL(`${id}.png`, destination).pathname);
  console.log(`Exported ${id}.png`);
}
