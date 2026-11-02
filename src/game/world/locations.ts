import type { TilePoint, TileRect, WorldPoint, WorldRect } from "./villageMap";

export const locationIds = ["market", "oracle", "camp", "post"] as const;
export type LocationId = (typeof locationIds)[number];

export type VillageLocation = {
  id: LocationId;
  name: string;
  purpose: string;
  directions: string;
  accent: string;
  footprint: TileRect;
  entrance: TilePoint;
  hitArea: WorldRect;
  label: WorldPoint;
};

export const locations: readonly VillageLocation[] = [
  { id: "market", name: "Market", purpose: "Browse the companions", directions: "north of the central plaza", accent: "#d9a441", footprint: { col: 10, row: 3, cols: 8, rows: 6 }, entrance: { col: 13, row: 9 }, hitArea: { x: 196, y: 34, width: 168, height: 162 }, label: { x: 280, y: 58 } },
  { id: "oracle", name: "Oracle", purpose: "Get a recommendation", directions: "in the tower on the north-east cliff, across the upper bridge", accent: "#9d7fd6", footprint: { col: 27, row: 2, cols: 6, rows: 6 }, entrance: { col: 29, row: 8 }, hitArea: { x: 528, y: 14, width: 144, height: 166 }, label: { x: 600, y: 100 } },
  { id: "camp", name: "Camp", purpose: "Ask for help", directions: "south-east, across the lower bridge", accent: "#6fae6a", footprint: { col: 30, row: 14, cols: 6, rows: 4 }, entrance: { col: 32, row: 18 }, hitArea: { x: 548, y: 244, width: 180, height: 166 }, label: { x: 660, y: 262 } },
  { id: "post", name: "Post Office", purpose: "Get village letters", directions: "west of the plaza", accent: "#d0553f", footprint: { col: 2, row: 9, cols: 6, rows: 5 }, entrance: { col: 5, row: 14 }, hitArea: { x: 32, y: 150, width: 152, height: 134 }, label: { x: 132, y: 168 } },
];

export const villageMapDescription = `Map of Willow Market. ${locations.map((l) => `${l.name}: ${l.purpose.toLowerCase()}, ${l.directions}.`).join(" ")} Use the location buttons below the map to visit each place.`;
