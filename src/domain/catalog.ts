export const productIds = ["ember", "moss", "bolt"] as const;
export type ProductId = (typeof productIds)[number];

export type Product = {
  id: ProductId;
  name: string;
  description: string;
  priceMinor: number;
  currency: "USD";
  available: boolean;
  color: string;
};

// Fictional demo catalog. Artwork and production merchandising come later.
export const catalog: readonly Product[] = [
  { id: "ember", name: "Ember", description: "A little dragon for a bold desk.", priceMinor: 2400, currency: "USD", available: true, color: "#e79153" },
  { id: "moss", name: "Moss", description: "A quiet slime companion for a calmer corner.", priceMinor: 1800, currency: "USD", available: true, color: "#9bbd79" },
  { id: "bolt", name: "Bolt", description: "A curious robot for your next idea.", priceMinor: 2800, currency: "USD", available: true, color: "#80b8d1" },
];

export function isProductId(value: string): value is ProductId {
  return productIds.some((id) => id === value);
}

export function getProduct(id: ProductId): Product {
  const product = catalog.find((item) => item.id === id);
  if (!product) throw new Error("Unknown product");
  return product;
}

export function formatMoney(minor: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(minor / 100);
}
