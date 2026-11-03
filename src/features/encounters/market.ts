import { getProduct } from "@/domain/catalog";
import type { EncounterContext, EncounterState, Node, ResolvedNode, SideView } from "./types";

const start: Node = {
  speaker: "milo",
  text: "Welcome to Willow Market, traveler! Every desk needs a little adventure. Care to meet my companions?",
  choices: [
    { id: "browse", label: "Browse the companions", next: "market-browse" },
    { id: "oracle", label: "Ask Milo for an Oracle referral", action: { type: "goto-location", location: "oracle" } },
    { id: "back", label: "Go back", action: { type: "close" } },
    { id: "bag", label: "Open my bag", action: { type: "open-bag" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
};

const browse: Node = {
  speaker: "milo",
  text: ({ productId }) => {
    const copy = {
      ember: "Ember's a brave little dragon. Warms any desk — and your coffee, if you ask nicely.",
      moss: "Moss is the calmest slime this side of the river. Water optional.",
      bolt: "Bolt tinkers with everything. Keep your stapler close.",
    } as const;
    return copy[productId];
  },
  choices: [
    { id: "add", label: "Add to bag", action: { type: "add-to-bag" } },
    { id: "next", label: "Next companion", action: { type: "browse-next" } },
    { id: "previous", label: "Previous companion", action: { type: "browse-previous" } },
    { id: "bag", label: "Open my bag", action: { type: "open-bag" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
  side: { kind: "product", productId: "ember", browsing: true },
};

const added: Node = {
  speaker: "milo",
  text: ({ productId }) => `Fine choice! ${getProduct(productId).name} is tucked into your bag.`,
  choices: [
    { id: "browse", label: "Keep browsing", next: "market-browse" },
    { id: "checkout", label: "Check out", action: { type: "checkout" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
  side: { kind: "product", productId: "ember" },
};

const bag: Node = {
  speaker: "bag",
  text: ({ cartCount }) => cartCount === 0
    ? "Your bag is empty. Browse the companions?"
    : "Your companions are safely tucked away. Ready to check out?",
  choices: [
    { id: "checkout", label: "Check out", action: { type: "checkout" } },
    { id: "browse", label: "Browse companions", action: { type: "goto-location", location: "market" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
  side: { kind: "bag" },
};

const receipt: Node = {
  speaker: "milo",
  text: "Done! A demo order, so nothing ships — but the village thanks you.",
  choices: [
    { id: "market", label: "Browse again", action: { type: "goto-location", location: "market" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
  side: { kind: "receipt" },
};

export const marketNodes: Readonly<Record<string, Node>> = {
  "market-start": start,
  "market-browse": browse,
  "market-added": added,
  "market-receipt": receipt,
  bag,
};

export function getEncounterNode(
  state: EncounterState,
  context: EncounterContext,
): ResolvedNode | null {
  if (!state.location || !state.nodeId) return null;
  const node = marketNodes[state.nodeId];
  if (!node) return null;
  const side: SideView = node.side?.kind === "product"
    ? { ...node.side, productId: state.productId }
    : node.side ?? null;
  return { ...node, text: typeof node.text === "function" ? node.text(context) : node.text, side };
}
