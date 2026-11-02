import type { Ctx } from "./canvas";
import { paintForeground, paintGround } from "./terrain";
import { buildingSprites } from "./buildings";
import { propSprites } from "./props";
import { paintPlayerSheet } from "./actors";
import { villageDecor } from "../world/decor";
import { villageProps } from "../world/villageMap";

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
const light = (x: number, y: number, radius: number, color: number, alpha: number): Light => ({ x, y, radius, color, alpha });

const WARM = 0xffc36b;
const FIRE = 0xff8c3c;
const VIOLET = 0xa082e6;

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
      ...villageProps.map((p) => at(p.id, p.col * 16 + 8, (p.row + 1) * 16)),
      at("owl", 26, 82),
      at("bridge-rail-upper", 360, 144),
      at("bridge-rail-lower", 368, 256),
      ...villageDecor.map((d) => at(d.kind, d.x, d.y)),
    ],
    lights: [
      ...villageDecor.filter((d) => d.kind === "lantern").map((d) => light(d.x + 2, d.y - 15, 26, WARM, 0.5)),
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
