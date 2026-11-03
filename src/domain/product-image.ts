import type { ProductId } from "./catalog";

export function productImagePath(productId: ProductId): string {
  return `/images/products/${productId}.png`;
}
