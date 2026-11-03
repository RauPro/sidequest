import { productIds, type ProductId } from "./catalog";

export function parseSoldOut(raw = process.env.NEXT_PUBLIC_SIDEQUEST_SOLD_OUT): Set<ProductId> {
  const knownIds = new Set<string>(productIds);
  return new Set((raw ?? "").split(",").map((id) => id.trim()).filter((id): id is ProductId => knownIds.has(id)));
}

export function isSoldOut(id: ProductId, soldOut = parseSoldOut()): boolean {
  return soldOut.has(id);
}
