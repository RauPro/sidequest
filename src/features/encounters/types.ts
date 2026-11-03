import type { ProductId } from "@/domain/catalog";
import type { DemoOrder } from "@/domain/orders";
import type { DeskMood, VisualStyle } from "@/domain/recommendations";
import type { CampReply } from "@/domain/campGuide";
import type { CampTopic } from "@/domain/campGuide";
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
  | { type: "browse-prev" }
  | { type: "open-bag" }
  | { type: "checkout" }
  | { type: "close" }
  | { type: "oracle-answer"; mood: DeskMood }
  | { type: "oracle-realm"; realm: VisualStyle }
  | { type: "oracle-show-alternate" }
  | { type: "oracle-show-primary" }
  | { type: "save-oracle" }
  | { type: "oracle-back" }
  | { type: "oracle-reset" }
  | { type: "camp-custom" }
  | { type: "camp-reset" }
  | { type: "camp-email-skip" }
  | { type: "send-chat"; content: string; topic: CampTopic }
  | { type: "subscribe" }
  | { type: "goto-location"; location: LocationId }
  | { type: "visit-product"; productId: ProductId };

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
  bagSource?: "market" | "hud";
  nodeId: NodeId | null;
  productId: ProductId;
  receipt: DemoOrder | null;
  deskMood: DeskMood | null;
  visualStyle: VisualStyle | null;
  recommendedProductId: ProductId | null;
  alternateProductId: ProductId | null;
  campReply: CampReply | null;
};

export type EncounterTransition = {
  state: EncounterState;
  effect?: Extract<EncounterAction, { type: "add-to-bag" | "checkout" }>;
};
