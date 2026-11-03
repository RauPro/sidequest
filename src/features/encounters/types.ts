import type { ProductId } from "@/domain/catalog";
import type { DemoOrder } from "@/domain/orders";
import type { LocationId } from "@/game/world/locations";

export type NpcId = "milo" | "oracle" | "finn" | "pip" | "bag";
export type NodeId = string;

export type EncounterContext = {
  productId: ProductId;
  cartCount: number;
  receipt: DemoOrder | null;
};

export type EncounterAction =
  | { type: "add-to-bag"; productId?: ProductId }
  | { type: "browse-next" }
  | { type: "browse-previous" }
  | { type: "open-bag" }
  | { type: "checkout" }
  | { type: "close" }
  | { type: "goto-location"; location: LocationId };

export type Choice = {
  id: string;
  label: string;
  next?: NodeId;
  action?: EncounterAction;
};

export type SideView =
  | { kind: "product"; productId: ProductId; browsing?: boolean }
  | { kind: "bag" }
  | { kind: "receipt" }
  | null;

export type Node = {
  speaker: NpcId;
  text: string | ((ctx: EncounterContext) => string);
  choices: Choice[];
  input?: "email" | "chat" | "email+consent";
  side?: SideView;
};

export type ResolvedNode = Omit<Node, "text"> & { text: string };

export type EncounterState = {
  location: LocationId | "bag" | null;
  nodeId: NodeId | null;
  productId: ProductId;
  receipt: DemoOrder | null;
};

export type EncounterTransition = {
  state: EncounterState;
  effect?: Extract<EncounterAction, { type: "add-to-bag" | "checkout" }>;
};
