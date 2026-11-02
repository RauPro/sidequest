import type { WorldRect } from "./villageMap";

export type DecorKind = "lantern" | "barrel" | "crate" | "pot" | "stump";

export const decorFeet: Readonly<Record<DecorKind, { width: number; height: number }>> = {
  lantern: { width: 4, height: 3 },
  barrel: { width: 10, height: 5 },
  crate: { width: 12, height: 6 },
  pot: { width: 6, height: 4 },
  stump: { width: 10, height: 5 },
};

export type VillageDecor = { kind: DecorKind; x: number; y: number };

export const villageDecor: readonly VillageDecor[] = [
  { kind: "lantern", x: 152, y: 168 }, { kind: "lantern", x: 328, y: 168 },
  { kind: "lantern", x: 152, y: 264 }, { kind: "lantern", x: 328, y: 264 },
  { kind: "lantern", x: 312, y: 146 }, { kind: "lantern", x: 394, y: 146 },
  { kind: "lantern", x: 330, y: 248 }, { kind: "lantern", x: 406, y: 252 },
  { kind: "lantern", x: 216, y: 336 }, { kind: "lantern", x: 240, y: 368 },
  { kind: "barrel", x: 162, y: 164 }, { kind: "crate", x: 176, y: 164 },
  { kind: "pot", x: 308, y: 164 }, { kind: "pot", x: 318, y: 166 },
  { kind: "stump", x: 470, y: 336 }, { kind: "stump", x: 522, y: 334 },
];

export function decorObstacles(): WorldRect[] {
  return villageDecor.map((d) => {
    const foot = decorFeet[d.kind];
    return { x: d.x - foot.width / 2, y: d.y - foot.height, width: foot.width, height: foot.height };
  });
}
