import {
  locationIds,
  nearestWalkableTile,
  TILE_SIZE,
  type TilePoint,
  type TileRect,
  type WorldPoint,
  type WorldRect,
} from "./villageMap";
import { locationHotspots } from "./walkAreas";

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

const descriptions: Readonly<Record<LocationId, Pick<VillageLocation, "name" | "purpose" | "directions">>> = {
  market: { name: "Market", purpose: "Browse the companions", directions: "north of the plaza" },
  oracle: {
    name: "Oracle",
    purpose: "Get a recommendation",
    directions: "in the tower on the north-east cliff, across the upper bridge or up the stairs",
  },
  camp: { name: "Camp", purpose: "Ask for help", directions: "south-east, across the lower bridge" },
  post: { name: "Post Office", purpose: "Get village letters", directions: "on the west side of the plaza" },
};

export const locations: readonly VillageLocation[] = locationIds.map((id) => {
  const hotspot = locationHotspots[id];
  const [left, top, right, bottom] = hotspot.rect;
  const hitArea = { x: left, y: top, width: right - left, height: bottom - top };
  const col = Math.floor(left / TILE_SIZE);
  const row = Math.floor(top / TILE_SIZE);
  const footprint: TileRect = {
    col,
    row,
    cols: Math.ceil(right / TILE_SIZE) - col,
    rows: Math.ceil(bottom / TILE_SIZE) - row,
  };
  const entrancePoint: WorldPoint = { x: hotspot.entrance[0], y: hotspot.entrance[1] };

  return {
    id,
    ...descriptions[id],
    footprint,
    entrance: nearestWalkableTile(entrancePoint),
    hitArea,
  };
});

export const villageMapDescription = `Map of Willow Market. ${locations.map((l) => `${l.name}: ${l.purpose.toLowerCase()}, ${l.directions}.`).join(" ")} Use the location buttons to visit each place.`;
