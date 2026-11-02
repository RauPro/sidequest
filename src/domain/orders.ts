import { cartLines, cartTotal, type Cart } from "./cart";

export function createDemoOrder(cart: Cart, id: string) {
  const lines = cartLines(cart);
  if (!lines.length) throw new Error("Cannot check out an empty bag");
  return {
    id,
    mode: "demo" as const,
    currency: "USD" as const,
    lines: lines.map(({ product, quantity }) => ({ productId: product.id, name: product.name, unitMinor: product.priceMinor, quantity })),
    totalMinor: cartTotal(cart),
  };
}

export type DemoOrder = ReturnType<typeof createDemoOrder>;
