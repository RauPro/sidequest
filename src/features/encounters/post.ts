import type { Node } from "./types";

export const postOfficeNode: Node = {
  speaker: "pip",
  text: "Mrrp! Fancy letters from Willow Market? New companions and village news, now and then.",
  input: "email+consent",
  choices: [
    { id: "not-now", label: "Not now", action: { type: "close" } },
  ],
};
