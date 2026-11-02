import type { ProductId } from "@/domain/catalog";

export const productCopy: Record<ProductId, {
  subtitle: string;
  description: string;
  traits: readonly string[];
  illustrationLabel: string;
}> = {
  ember: {
    subtitle: "The brave little dragon",
    description: "A fiery orange companion who brings warmth, courage, and a little adventure to your desk.",
    traits: ["Brave", "Warm", "Adventurous"],
    illustrationLabel: "Pixel-art concept of Ember, an orange dragon with small wings and golden horns",
  },
  moss: {
    subtitle: "The gentle green slime",
    description: "A cheerful, easygoing companion who reminds you to slow down and enjoy the small things.",
    traits: ["Gentle", "Cheerful", "Easygoing"],
    illustrationLabel: "Pixel-art concept of Moss, a green slime with a friendly face",
  },
  bolt: {
    subtitle: "The curious blue robot",
    description: "A tiny explorer with a big imagination, always ready for your next idea or experiment.",
    traits: ["Curious", "Inventive", "Playful"],
    illustrationLabel: "Pixel-art concept of Bolt, a blue robot with an antenna and bright eyes",
  },
};
