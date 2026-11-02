import { locationIds, type TilePoint, type TileRect, type WorldRect } from "./villageMap";

export { locationIds };
export type { LocationId } from "./villageMap";
import type { LocationId } from "./villageMap";

export type VillageLocation = {
  id: LocationId;
  name: string;
  purpose: string;
  directions: string;
  footprint: TileRect;
  entrance: TilePoint;
  hitArea: WorldRect;
};

export const locations: readonly VillageLocation[] = [
  { id: "market", name: "Market", purpose: "Browse the companions", directions: "north of the plaza", footprint: { col: 10, row: 3, cols: 9, rows: 7 }, entrance: { col: 14, row: 10 }, hitArea: { x: 156, y: 28, width: 152, height: 150 } },
  { id: "oracle", name: "Oracle", purpose: "Get a recommendation", directions: "in the tower on the north-east cliff, across the upper bridge or up the stairs", footprint: { col: 26, row: 2, cols: 5, rows: 6 }, entrance: { col: 28, row: 9 }, hitArea: { x: 396, y: 4, width: 120, height: 142 } },
  { id: "camp", name: "Camp", purpose: "Ask for help", directions: "south-east, across the lower bridge", footprint: { col: 28, row: 16, cols: 6, rows: 4 }, entrance: { col: 27, row: 19 }, hitArea: { x: 412, y: 228, width: 136, height: 112 } },
  { id: "post", name: "Post Office", purpose: "Get village letters", directions: "on the west side of the plaza", footprint: { col: 1, row: 9, cols: 6, rows: 8 }, entrance: { col: 4, row: 17 }, hitArea: { x: 12, y: 124, width: 120, height: 150 } },
];

export const villageMapDescription = `Map of Willow Market. ${locations.map((l) => `${l.name}: ${l.purpose.toLowerCase()}, ${l.directions}.`).join(" ")} Use the location buttons below the map to visit each place.`;
