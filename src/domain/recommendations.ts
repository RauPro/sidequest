import type { ProductId } from "./catalog";

export const moods = ["bold", "calm", "curious"] as const;
export type DeskMood = (typeof moods)[number];
export const visualStyles = ["fantasy", "nature", "technology"] as const;
export type VisualStyle = (typeof visualStyles)[number];
export const recommendationRuleVersion = "2";

export function recommend(
  mood: DeskMood,
  realm?: VisualStyle,
): { productId: ProductId; alternateId?: ProductId; explanation: string } {
  const rules = {
    bold: "ember",
    calm: "moss",
    curious: "bolt",
  } as const;
  const productId = rules[mood];
  const realms = { fantasy: "ember", nature: "moss", technology: "bolt" } as const;
  const alternateId = realm ? realms[realm] : undefined;
  const alternate = alternateId && alternateId !== productId ? alternateId : undefined;
  const name = (id: ProductId) => ({ ember: "Ember", moss: "Moss", bolt: "Bolt" })[id];
  return {
    productId,
    ...(alternate ? { alternateId: alternate } : {}),
    explanation: `You seek a ${mood} desk, and ${name(productId)} answers.${alternate ? ` The ${realm} stars also whisper of ${name(alternate)}.` : ""}`,
  };
}
