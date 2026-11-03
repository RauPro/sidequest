import { containsPoint, MAP_COLS, MAP_ROWS, TILE_SIZE, tileAt, type TilePoint, type WorldPoint } from "../world/villageMap";
import { ducks, type NpcDefinition } from "../world/villageFx";
import { walkAreas } from "../world/walkAreas";
import { findPath, tileWalkable } from "./pathfinding";

export type NpcFacing = "down" | "left" | "right" | "up";
export type NpcGesture = "wave" | null;
export type RandomSource = () => number;

type Motion = {
  x: number;
  y: number;
  facing: NpcFacing;
  walking: boolean;
};

type WanderState = Motion & {
  kind: "wander";
  definition: Extract<NpcDefinition, { behavior: "wander" }>;
  areaKeys: ReadonlySet<string>;
  path: WorldPoint[];
  idleRemainingMs: number;
};

type PaceState = Motion & {
  kind: "pace";
  definition: Extract<NpcDefinition, { behavior: "pace" }>;
  targetX: number;
  idleRemainingMs: number;
  gestureRemainingMs: number;
  gesture: NpcGesture;
};

export type NpcState = WanderState | PaceState;

export type DuckState = {
  x: number;
  y: number;
  target: WorldPoint | null;
  idleRemainingMs: number;
  facing: "left" | "right";
  walking: boolean;
};

const tileKey = ({ col, row }: TilePoint) => `${col},${row}`;
const randomBetween = (min: number, max: number, rng: RandomSource) => min + Math.max(0, Math.min(0.999999999, rng())) * (max - min);
const randomIndex = (length: number, rng: RandomSource) => Math.floor(Math.max(0, Math.min(0.999999999, rng())) * length);
const tileFor = (x: number, y: number): TilePoint => ({
  col: Math.floor(x / TILE_SIZE),
  row: Math.floor(y / TILE_SIZE),
});
const tileCenter = ({ col, row }: TilePoint): WorldPoint => ({
  x: col * TILE_SIZE + TILE_SIZE / 2,
  y: row * TILE_SIZE + TILE_SIZE / 2,
});

export function npcAreaTiles(areas: readonly string[]): TilePoint[] {
  const polygons = areas.map((name) => walkAreas[name]).filter((polygon) => polygon !== undefined);
  const tiles: TilePoint[] = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      if (!tileWalkable(col, row)) continue;
      const center = tileCenter({ col, row });
      if (polygons.some((polygon) => containsPoint(center.x, center.y, polygon))) {
        tiles.push({ col, row });
      }
    }
  }
  return tiles;
}

function randomIdle(rng: RandomSource) {
  return randomBetween(2000, 6000, rng);
}

function getFacing(dx: number, dy: number): NpcFacing {
  return Math.abs(dx) >= Math.abs(dy)
    ? dx < 0 ? "left" : "right"
    : dy < 0 ? "up" : "down";
}

function createWanderState(
  definition: Extract<NpcDefinition, { behavior: "wander" }>,
  rng: RandomSource,
): WanderState {
  const areaTiles = npcAreaTiles(definition.areas);
  const areaKeys = new Set(areaTiles.map(tileKey));
  const homeTile = tileFor(...definition.home);
  const home = tileCenter(homeTile);
  return {
    kind: "wander",
    definition,
    areaKeys,
    path: [],
    x: home.x,
    y: home.y,
    facing: "down",
    walking: false,
    idleRemainingMs: randomIdle(rng),
  };
}

function startPaceIdle(state: PaceState, rng: RandomSource) {
  state.idleRemainingMs = randomBetween(3000, 7000, rng);
  state.gesture = rng() < 0.22 ? "wave" : null;
  state.gestureRemainingMs = state.gesture ? 1200 : 0;
  state.facing = "down";
  state.walking = false;
}

function createPaceState(
  definition: Extract<NpcDefinition, { behavior: "pace" }>,
  rng: RandomSource,
): PaceState {
  const state: PaceState = {
    kind: "pace",
    definition,
    x: definition.home[0],
    y: definition.home[1],
    targetX: definition.home[0],
    facing: "down",
    walking: false,
    idleRemainingMs: 0,
    gestureRemainingMs: 0,
    gesture: null,
  };
  startPaceIdle(state, rng);
  return state;
}

export function createNpcState(definition: NpcDefinition, rng: RandomSource): NpcState {
  return definition.behavior === "wander"
    ? createWanderState(definition, rng)
    : createPaceState(definition, rng);
}

function advanceToward(
  state: Motion,
  target: WorldPoint,
  speed: number,
  dtMs: number,
): boolean {
  const dx = target.x - state.x;
  const dy = target.y - state.y;
  const distance = Math.hypot(dx, dy);
  const step = speed * Math.max(0, dtMs) / 1000;
  if (distance <= step || distance < 0.001) {
    state.x = target.x;
    state.y = target.y;
    return true;
  }
  state.facing = getFacing(dx, dy);
  state.x += dx / distance * step;
  state.y += dy / distance * step;
  state.walking = true;
  return false;
}

function stepWander(state: WanderState, dtMs: number, rng: RandomSource): WanderState {
  if (state.path.length === 0) {
    state.walking = false;
    state.facing = "down";
    state.idleRemainingMs -= dtMs;
    if (state.idleRemainingMs > 0) return state;

    const tiles = [...state.areaKeys];
    if (tiles.length === 0) {
      state.idleRemainingMs = randomIdle(rng);
      return state;
    }
    const targetTile = tiles[randomIndex(tiles.length, rng)].split(",").map(Number);
    const start = tileFor(state.x, state.y);
    const target = { col: targetTile[0], row: targetTile[1] };
    const path = findPath(start, target, (col, row) => state.areaKeys.has(`${col},${row}`));
    if (!path?.length) {
      state.idleRemainingMs = randomIdle(rng);
      return state;
    }
    state.path = path.map(tileCenter);
  }

  let remainingMs = Math.max(0, dtMs);
  state.walking = true;
  while (state.path.length && remainingMs > 0) {
    const target = state.path[0];
    const distance = Math.hypot(target.x - state.x, target.y - state.y);
    const timeToTarget = distance / state.definition.speed * 1000;
    if (timeToTarget <= remainingMs) {
      advanceToward(state, target, state.definition.speed, timeToTarget);
      state.path.shift();
      remainingMs -= timeToTarget;
    } else {
      advanceToward(state, target, state.definition.speed, remainingMs);
      remainingMs = 0;
    }
  }
  if (state.path.length === 0) {
    state.walking = false;
    state.facing = "down";
    state.idleRemainingMs = randomIdle(rng);
  }
  return state;
}

function stepPace(state: PaceState, dtMs: number, rng: RandomSource): PaceState {
  if (!state.walking) {
    state.idleRemainingMs -= dtMs;
    state.gestureRemainingMs = Math.max(0, state.gestureRemainingMs - dtMs);
    if (state.gestureRemainingMs === 0) state.gesture = null;
    if (state.idleRemainingMs > 0) return state;
    const [min, max] = state.definition.range;
    state.targetX = randomBetween(min, max, rng);
    state.facing = "right";
    state.walking = true;
    state.gesture = null;
  }

  const dx = state.targetX - state.x;
  const step = state.definition.speed * Math.max(0, dtMs) / 1000;
  if (Math.abs(dx) <= step || Math.abs(dx) < 0.001) {
    state.x = state.targetX;
    startPaceIdle(state, rng);
  } else {
    state.facing = dx < 0 ? "left" : "right";
    state.x += Math.sign(dx) * step;
    state.walking = true;
  }
  return state;
}

export function stepNpc(state: NpcState, dtMs: number, rng: RandomSource): NpcState {
  return state.kind === "wander"
    ? stepWander(state, dtMs, rng)
    : stepPace(state, dtMs, rng);
}

function pointOnSegmentInside(start: WorldPoint, end: WorldPoint, polygon: typeof ducks.area) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const checks = Math.max(1, Math.ceil(distance / 4));
  for (let index = 1; index <= checks; index++) {
    const t = index / checks;
    if (!containsPoint(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t, polygon)) {
      return false;
    }
  }
  return true;
}

function randomDuckTarget(state: DuckState, rng: RandomSource): WorldPoint {
  const xs = ducks.area.map(([x]) => x);
  const ys = ducks.area.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const target = {
      x: randomBetween(minX, maxX, rng),
      y: randomBetween(minY, maxY, rng),
    };
    if (containsPoint(target.x, target.y, ducks.area) && pointOnSegmentInside(state, target, ducks.area)) {
      return target;
    }
  }
  return { x: state.x, y: state.y };
}

export function createDuckState(rng: RandomSource): DuckState {
  const [x, y] = ducks.spawns[0];
  return {
    x,
    y,
    target: null,
    idleRemainingMs: randomBetween(1000, 4000, rng),
    facing: "left",
    walking: false,
  };
}

export function stepDuck(state: DuckState, dtMs: number, rng: RandomSource): DuckState {
  if (!state.target) {
    state.idleRemainingMs -= dtMs;
    if (state.idleRemainingMs > 0) return state;
    state.target = randomDuckTarget(state, rng);
    state.walking = true;
  }
  const dx = state.target.x - state.x;
  const dy = state.target.y - state.y;
  const distance = Math.hypot(dx, dy);
  const step = ducks.speed * Math.max(0, dtMs) / 1000;
  if (distance <= step || distance < 0.001) {
    state.x = state.target.x;
    state.y = state.target.y;
    state.target = null;
    state.idleRemainingMs = randomBetween(1000, 4000, rng);
    state.walking = false;
  } else {
    state.facing = dx < 0 ? "left" : "right";
    state.x += dx / distance * step;
    state.y += dy / distance * step;
  }
  return state;
}

export function npcTile(state: NpcState): TilePoint {
  return tileFor(state.x, state.y);
}

export function npcTileIsWalkable(state: NpcState): boolean {
  const tile = npcTile(state);
  return tileAt(tile.col, tile.row) === "walkable";
}
