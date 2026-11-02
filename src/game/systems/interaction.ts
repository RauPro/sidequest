import type { LocationId } from "../world/locations";

// A semantic bridge: engine interactions never own or mutate the cart.
export type LocationHandler = (location: LocationId) => void;
