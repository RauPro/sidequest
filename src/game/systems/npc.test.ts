import { describe, expect, it } from "vitest";
import { containsPoint, TILE_SIZE } from "../world/villageMap";
import { ducks, npcs } from "../world/villageFx";
import { npcAreaTiles, createDuckState, createNpcState, npcTile, stepDuck, stepNpc } from "./npc";

function seededRng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runTrajectory(seed: number) {
  const rng = seededRng(seed);
  const npcStates = npcs.map((definition) => createNpcState(definition, rng));
  const duckStates = ducks.spawns.map((spawn) => createDuckState(rng, spawn));
  const areaTileKeys = npcStates.map((state) =>
    state.kind === "wander"
      ? new Set(npcAreaTiles(state.definition.areas).map(({ col, row }) => `${col},${row}`))
      : null,
  );
  const trajectory: number[] = [];
  const steps = (10 * 60 * 1000) / 16;
  for (let index = 0; index < steps; index++) {
    for (let stateIndex = 0; stateIndex < npcStates.length; stateIndex++) {
      const state = stepNpc(npcStates[stateIndex], 16, rng);
      npcStates[stateIndex] = state;
      if (state.kind === "wander") {
        const key = `${npcTile(state).col},${npcTile(state).row}`;
        expect(areaTileKeys[stateIndex]?.has(key)).toBe(true);
      } else {
        expect(state.y).toBe(state.definition.home[1]);
        expect(state.x).toBeGreaterThanOrEqual(state.definition.range[0]);
        expect(state.x).toBeLessThanOrEqual(state.definition.range[1]);
      }
    }
    for (const duck of duckStates) {
      stepDuck(duck, 16, rng);
      expect(containsPoint(duck.x, duck.y, ducks.area)).toBe(true);
    }
    if (index % 375 === 0) {
      trajectory.push(
        ...npcStates.flatMap((state) => [state.x, state.y]),
        ...duckStates.flatMap((duck) => [duck.x, duck.y]),
      );
    }
  }
  return trajectory;
}

describe("ambient NPC simulation", () => {
  it("keeps wanderers on area tiles, Milo on his pace line, and ducks in their pond", () => {
    runTrajectory(0x51de);
  });

  it("produces the same trajectory from the same random seed", () => {
    expect(runTrajectory(0xabc123)).toEqual(runTrajectory(0xabc123));
  });

  it("centres wanderers on their home tile initially", () => {
    const state = createNpcState(npcs.find((npc) => npc.behavior === "wander")!, seededRng(12));
    expect(state.kind).toBe("wander");
    if (state.kind === "wander") {
      const definition = state.definition;
      expect(state.x).toBe(Math.floor(definition.home[0] / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2);
      expect(state.y).toBe(Math.floor(definition.home[1] / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2);
    }
  });
});
