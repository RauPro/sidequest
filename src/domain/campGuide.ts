import { formatMoney, getProduct, productIds, type ProductId } from "./catalog";

export type CampReply =
  | { kind: "message"; text: string }
  | { kind: "product"; productId?: ProductId; title: string; url?: string }
  | { kind: "handoff" }
  | { kind: "auth-required" };

export type CampGuideResult = { replies: CampReply[]; open: boolean };
export type CampTopic = "companion" | "checkout" | "shipping" | "custom";

function productReply(productId: ProductId): CampReply {
  const product = getProduct(productId);
  return {
    kind: "product",
    productId,
    title: product.name,
    url: `/products/${productId}`,
  };
}

function companionForMood(question: string): ProductId | null {
  if (/\b(bold|fire|fiery|warm)\b/.test(question)) return "ember";
  if (/\b(calm|gentle|quiet|nature)\b/.test(question)) return "moss";
  if (/\b(curious|tinker|technology|tech)\b/.test(question)) return "bolt";
  return null;
}

export function matchCampQuestion(input: string): CampGuideResult {
  const question = input.trim().toLowerCase();
  if (/\b(companion|suit|recommend|which)\b/.test(question)) {
    const productId = companionForMood(question);
    if (productId) {
      return {
        open: true,
        replies: [
          { kind: "message", text: `${getProduct(productId).name} could be a good fit for your desk.` },
          productReply(productId),
        ],
      };
    }
    return { open: true, replies: [{ kind: "message", text: "The Oracle can help match a companion to your desk mood." }] };
  }
  if (/\b(checkout|pay|payment|order)\b/.test(question)) {
    return { open: true, replies: [{ kind: "message", text: "Checkout is a demo: no payment is taken and nothing is delivered." }] };
  }
  if (/\b(ship|shipping|deliver|return)\b/.test(question)) {
    return { open: true, replies: [{ kind: "message", text: "This is a fictional demo village — nothing ships, and no payment is taken." }] };
  }
  const mentionedProduct = productIds.find((id) => new RegExp(`\\b${id}\\b`).test(question));
  if (mentionedProduct) {
    return {
      open: true,
      replies: [
        { kind: "message", text: getProduct(mentionedProduct).description },
        productReply(mentionedProduct),
      ],
    };
  }
  if (/\b(price|cost)\b/.test(question)) {
    return {
      open: true,
      replies: [{ kind: "message", text: productIds.map((id) => `${getProduct(id).name}: ${formatMoney(getProduct(id).priceMinor)}`).join(" · ") }],
    };
  }
  if (/^(hi|hello|hey)\b/.test(question)) {
    return { open: true, replies: [{ kind: "message", text: "Hello! Welcome to Willow Market." }] };
  }
  return { open: true, replies: [{ kind: "message", text: "I only know village matters — companions, checkout and the Oracle." }] };
}
