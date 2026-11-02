import type { Ctx } from "./canvas";
import { paintForeground, paintGround } from "./terrain";
import { buildingSprites } from "./buildings";
import { propSprites } from "./props";
import { paintPlayerSheet } from "./actors";

export type PaintFn = (ctx: Ctx) => void;
export type SpriteArt = { key: string; width: number; height: number; paint: PaintFn };
export type Placement = { key: string; x: number; y: number; originX: number; originY: number; depth?: number };
export type Light = { x: number; y: number; radius: number; color: number; alpha: number };
export type VillageArt = {
  ground: PaintFn;
  foreground: PaintFn;
  sprites: readonly SpriteArt[];
  placements: readonly Placement[];
  lights: readonly Light[];
  player: SpriteArt;
};

const at = (key: string, x: number, y: number, depth?: number): Placement => ({ key, x, y, originX: 0.5, originY: 1, depth });
const lanternAt = (x: number, y: number): Placement[] => [at("lantern", x, y)];
const light = (x: number, y: number, radius: number, color: number, alpha: number): Light => ({ x, y, radius, color, alpha });

const WARM = 0xffc36b;
const FIRE = 0xff8c3c;
const VIOLET = 0xa082e6;

const lanternSpots = [
  [152, 168], [328, 168], [152, 264], [328, 264],
  [312, 146], [394, 146], [330, 248], [406, 252],
  [216, 336], [240, 368],
] as const;

export function buildVillageArt(): VillageArt {
  return {
    ground: paintGround,
    foreground: paintForeground,
    sprites: [...buildingSprites, ...propSprites],
    placements: [
      at("bld-market", 232, 160),
      at("bld-oracle", 456, 128),
      at("bld-post", 64, 272),
      at("bld-camp", 496, 320),
      at("merchant", 280, 176),
      at("oracle-table", 456, 144),
      at("post-sign", 120, 224, 273),
      at("mailbox", 120, 256),
      at("cat-crate", 24, 288),
      at("camp-sign", 424, 288),
      at("log-seat", 424, 336),
      at("campfire", 440, 336),
      at("camp-kid", 456, 336),
      at("dog", 504, 336),
      at("owl", 26, 82),
      at("bridge-rail-upper", 360, 144),
      at("bridge-rail-lower", 368, 256),
      at("barrel", 162, 164),
      at("crate", 176, 164),
      at("pot", 308, 164),
      at("pot", 318, 166),
      at("stump", 470, 336),
      at("stump", 522, 334),
      ...lanternSpots.flatMap(([x, y]) => lanternAt(x, y)),
    ],
    lights: [
      ...lanternSpots.map(([x, y]) => light(x + 2, y - 15, 26, WARM, 0.5)),
      light(232, 104, 74, WARM, 0.5),
      light(274, 146, 20, WARM, 0.45),
      light(456, 116, 28, VIOLET, 0.5),
      light(457, 126, 16, VIOLET, 0.55),
      light(40, 225, 18, WARM, 0.45),
      light(90, 225, 18, WARM, 0.45),
      light(66, 250, 22, WARM, 0.4),
      light(440, 330, 46, FIRE, 0.6),
      light(496, 298, 32, WARM, 0.45),
    ],
    player: { key: "player", width: 48, height: 72, paint: paintPlayerSheet },
  };
}
