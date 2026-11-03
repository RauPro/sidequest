import rawFx from "./villageFx.json";
import type { WalkPolygon } from "./walkAreas";

export const FX_WIDTH = 1536;
export const FX_HEIGHT = 1024;
export const FX_FRAMES = 8;

export type FxBounds = { x: number; y: number; width: number; height: number };
export type WaterRegion = { id: string; kind: "fall" | "pool"; polygon: WalkPolygon };
export type SwayRegion = {
  id: string;
  kind: "banner" | "tree";
  amplitude: number;
  polygon: WalkPolygon;
};
export type OccluderRegion = { id: string; polygon: WalkPolygon; mask?: "foliage" };
export type FxLight = {
  x: number;
  y: number;
  radius: number;
  color: string;
  kind: "lantern" | "candle" | "crystal" | "fire";
};
export type WanderNpcDefinition = {
  id: string;
  texture: string;
  behavior: "wander";
  home: readonly [number, number];
  areas: readonly string[];
  speed: number;
  walkRows: Readonly<Record<"down" | "left" | "right" | "up", number>>;
};
export type PaceNpcDefinition = {
  id: string;
  texture: string;
  behavior: "pace";
  home: readonly [number, number];
  range: readonly [number, number];
  speed: number;
  idleRow: number;
  walkRows: Readonly<{ down: number; right: number }>;
};
export type NpcDefinition = WanderNpcDefinition | PaceNpcDefinition;
export type DuckDefinition = {
  texture: string;
  area: WalkPolygon;
  spawns: readonly (readonly [number, number])[];
  speed: number;
};
export type VillageFx = {
  frameRate: number;
  water: readonly WaterRegion[];
  sway: readonly SwayRegion[];
  occluders: readonly OccluderRegion[];
  lights: readonly FxLight[];
  embers: { x: number; y: number; width: number };
  sleeper: { x: number; y: number };
  npcs: readonly NpcDefinition[];
  ducks: DuckDefinition;
};

export const fx = rawFx as unknown as VillageFx;
export const { frameRate, water, sway, occluders, lights, embers, sleeper, npcs, ducks } = fx;

export function fxBounds(polygon: WalkPolygon): FxBounds {
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  const x = Math.max(0, Math.floor(Math.min(...xs)));
  const y = Math.max(0, Math.floor(Math.min(...ys)));
  return {
    x,
    y,
    width: Math.min(FX_WIDTH, Math.ceil(Math.max(...xs))) - x,
    height: Math.min(FX_HEIGHT, Math.ceil(Math.max(...ys))) - y,
  };
}
