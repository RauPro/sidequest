import { getProduct } from "@/domain/catalog";
import { recommend } from "@/domain/recommendations";
import type { EncounterState, Node } from "./types";

const start: Node = {
  speaker: "oracle",
  text: "The stars stir... Tell me of your desk, seeker. What spirit should fill it?",
  choices: [
    { id: "bold", label: "Bold — something with fire", action: { type: "oracle-answer", mood: "bold" } },
    { id: "calm", label: "Calm — something gentle", action: { type: "oracle-answer", mood: "calm" } },
    { id: "curious", label: "Curious — something that tinkers", action: { type: "oracle-answer", mood: "curious" } },
    { id: "not-now", label: "Not now", action: { type: "close" } },
  ],
};

const realms: Node = {
  speaker: "oracle",
  text: "And which realm calls to you?",
  choices: [
    { id: "fantasy", label: "Fantasy", action: { type: "oracle-realm", realm: "fantasy" } },
    { id: "nature", label: "Nature", action: { type: "oracle-realm", realm: "nature" } },
    { id: "technology", label: "Technology", action: { type: "oracle-realm", realm: "technology" } },
    { id: "back", label: "Back", action: { type: "oracle-reset" } },
  ],
};

const remember: Node = {
  speaker: "oracle",
  text: "Whisper your email and I'll keep this reading on your village profile. This is not a newsletter signup.",
  choices: [{ id: "back", label: "Back", action: { type: "oracle-back" } }],
  input: "email",
};

export function getOracleNode(state: EncounterState): Node | null {
  if (state.nodeId === "oracle-start") return start;
  if (state.nodeId === "oracle-realm") return realms;
  if (state.nodeId === "oracle-save") return remember;
  if (state.nodeId !== "oracle-reveal" || !state.deskMood || !state.visualStyle) return null;

  const result = recommend(state.deskMood, state.visualStyle);
  const isAlternate = state.productId === result.alternateId;
  const product = getProduct(state.productId);
  const nextProduct = isAlternate ? result.productId : result.alternateId;
  return {
    speaker: "oracle",
    text: result.explanation,
    side: { kind: "product", productId: state.productId },
    choices: [
      { id: "add", label: `Add ${product.name} to bag`, action: { type: "add-to-bag", productId: state.productId } },
      ...(nextProduct
        ? [{ id: "alternate", label: `Show me ${getProduct(nextProduct).name}`, action: { type: isAlternate ? "oracle-show-primary" as const : "oracle-show-alternate" as const } }]
        : []),
      { id: "remember", label: "Remember this reading", action: { type: "save-oracle" } },
      { id: "again", label: "Ask again", action: { type: "oracle-reset" } },
      { id: "explore", label: "Keep exploring", action: { type: "close" } },
    ],
  };
}
