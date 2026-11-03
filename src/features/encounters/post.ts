import type { Node } from "./types";
import type { LetterId } from "@/domain/letters";
import type { ProductId } from "@/domain/catalog";

export const postOfficeNode: Node = {
  speaker: "pip",
  text: "Mrrp! Fancy letters from Willow Market? New companions and village news, now and then.",
  input: "email+consent",
  choices: [
    { id: "not-now", label: "Not now", action: { type: "close" } },
  ],
};

const companionLetters: Record<Exclude<LetterId, "welcome">, { name: string; text: string; productId: ProductId }> = {
  ember: { name: "Ember", text: "Milo writes: Ember's courage is contagious. I think you'd make a fine team at the Market.", productId: "ember" },
  moss: { name: "Moss", text: "Milo writes: Moss brings a little calm wherever they go. There's a quiet corner waiting at the Market.", productId: "moss" },
  bolt: { name: "Bolt", text: "Milo writes: Bolt is already tinkering with the Market sign. Perhaps you can keep each other curious.", productId: "bolt" },
};

export const postOfficeNodes: Readonly<Record<string, Node>> = {
  "post-start": postOfficeNode,
  ...Object.fromEntries(Object.entries(companionLetters).map(([letter, companion]) => [
    `post-letter-${letter}`,
    {
      speaker: "milo" as const,
      text: companion.text,
      choices: [
        { id: "visit-market", label: `Visit ${companion.name} at the Market`, action: { type: "visit-product" as const, productId: companion.productId } },
        { id: "explore", label: "Keep exploring", action: { type: "close" as const } },
      ],
    },
  ])),
  "post-letter-welcome": {
    speaker: "pip",
    text: "A welcome letter from Milo: the Market is open, the Oracle is ready, and the village is yours to explore.",
    choices: [
      { id: "visit-market", label: "Visit the Market", action: { type: "goto-location", location: "market" } },
      { id: "explore", label: "Keep exploring", action: { type: "close" } },
    ],
  },
};
