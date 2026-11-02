import type { ProductId } from "./catalog";

export const moods = ["bold", "calm", "curious"] as const;
export type DeskMood = (typeof moods)[number];
export const recommendationRuleVersion = "1";

export function recommend(mood: DeskMood): { productId: ProductId; explanation: string } {
  const rules = {
    bold: { productId: "ember", explanation: "You chose a bold desk mood. Ember brings a little fire." },
    calm: { productId: "moss", explanation: "You chose a calm desk mood. Moss keeps things gentle." },
    curious: { productId: "bolt", explanation: "You chose a curious desk mood. Bolt is ready to investigate." },
  } as const;
  return rules[mood];
}
