import { getProduct } from "@/domain/catalog";
import type { EncounterContext, EncounterState, Node, ResolvedNode, SideView } from "./types";
import { getOracleNode } from "./oracle";

const start: Node = {
  speaker: "milo",
  text: "Welcome to Willow Market, traveler! Every desk needs a little adventure. Care to meet my companions?",
  choices: [
    { id: "browse", label: "Show me the companions", next: "market-browse" },
    { id: "oracle", label: "Help me choose", next: "market-oracle-referral" },
    { id: "back", label: "Back", action: { type: "close" } },
    { id: "bag", label: "Open my bag", action: { type: "open-bag" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
};

const oracleReferral: Node = {
  speaker: "milo",
  text: "The Oracle across the upper bridge reads desk moods. Shall I point the way?",
  choices: [
    { id: "yes", label: "Yes, show me", action: { type: "goto-location", location: "oracle" } },
    { id: "back", label: "Back", next: "market-start" },
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
    { id: "previous", label: "Previous companion", action: { type: "browse-prev" } },
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
    : "Ready to settle up? It's a demo — no coins change hands.",
  choices: [
    { id: "checkout", label: "Complete demo order", action: { type: "checkout" } },
    { id: "browse", label: "Keep browsing", action: { type: "goto-location", location: "market" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
  side: { kind: "bag" },
};

const receipt: Node = {
  speaker: "milo",
  text: "Done! A demo order, so nothing ships — but the village thanks you.",
  choices: [
    { id: "market", label: "Start another order", action: { type: "goto-location", location: "market" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
  side: { kind: "receipt" },
};

export const marketNodes: Readonly<Record<string, Node>> = {
  "market-start": start,
  "market-oracle-referral": oracleReferral,
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
  if (state.location === "oracle") {
    const node = getOracleNode(state);
    if (!node) return null;
    const side = node.side?.kind === "product"
      ? { ...node.side, productId: state.productId }
      : node.side ?? null;
    return { ...node, text: typeof node.text === "function" ? node.text(context) : node.text, side };
  }
  const node = marketNodes[state.nodeId];
  if (!node) return null;
  const side: SideView = node.side?.kind === "product"
    ? { ...node.side, productId: state.productId }
    : node.side ?? null;
  return { ...node, text: typeof node.text === "function" ? node.text(context) : node.text, side };
}
