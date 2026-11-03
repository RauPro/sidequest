import type { EncounterState, Node } from "./types";

const start: Node = {
  speaker: "finn",
  text: "Pull up a log, traveler! Ask me anything about the companions, checkout, or the village.",
  input: "chat",
  choices: [
    { id: "companion", label: "Which companion suits me?", action: { type: "send-chat", content: "Which companion suits me?", topic: "companion" } },
    { id: "checkout", label: "How does checkout work?", action: { type: "send-chat", content: "How does checkout work?", topic: "checkout" } },
    { id: "shipping", label: "Is shipping real?", action: { type: "send-chat", content: "Is shipping real?", topic: "shipping" } },
    { id: "custom", label: "Ask my own question", action: { type: "camp-custom" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
};

const custom: Node = {
  speaker: "finn",
  text: "Ask me your own question, traveler.",
  input: "chat",
  choices: [
    { id: "back", label: "Back", next: "camp-start" },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
};

const emailChoice: Node = {
  speaker: "finn",
  text: "Share your email so the guide can follow up (optional).",
  input: "email",
  choices: [
    { id: "skip", label: "Skip", action: { type: "camp-email-skip" } },
  ],
};

const handoff: Node = {
  speaker: "finn",
  text: "",
  choices: [
    { id: "restart", label: "Start a new chat", action: { type: "camp-reset" } },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
};

const authRequired: Node = {
  speaker: "finn",
  text: "Sign-in isn't available in this demo village.",
  choices: [
    { id: "back", label: "Keep chatting", next: "camp-start" },
    { id: "explore", label: "Keep exploring", action: { type: "close" } },
  ],
};

export function getCampNode(state: EncounterState): Node | null {
  if (state.nodeId === "camp-start") return start;
  if (state.nodeId === "camp-custom") return custom;
  if (state.nodeId === "camp-email") return emailChoice;
  if (state.nodeId === "camp-handoff") return handoff;
  if (state.nodeId === "camp-auth-required") return authRequired;
  if (state.nodeId === "camp-product" && state.campReply?.kind === "product") {
    return {
      speaker: "finn",
      text: `I found ${state.campReply.title} in the Market.`,
      choices: [
        ...(state.campReply.productId
          ? [{ id: "market", label: `See ${state.campReply.title} in the Market`, action: { type: "goto-location" as const, location: "market" as const } }]
          : []),
        { id: "back", label: "Back to Camp", next: "camp-start" },
        { id: "explore", label: "Keep exploring", action: { type: "close" } },
      ],
      side: state.campReply.productId ? { kind: "product", productId: state.campReply.productId } : null,
    };
  }
  return null;
}
