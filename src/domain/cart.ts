import { getProduct, isProductId, type ProductId } from "./catalog";
import { isSoldOut } from "./inventory";

export type Cart = Readonly<Partial<Record<ProductId, number>>>;
export const emptyCart: Cart = Object.freeze({});
export const maxQuantity = 99;

export function setQuantity(cart: Cart, id: ProductId, quantity: number): Cart {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > maxQuantity) throw new Error("Invalid quantity");
  if ((!getProduct(id).available || isSoldOut(id)) && quantity > 0) throw new Error("Product unavailable");
  const next = { ...cart };
  if (quantity === 0) delete next[id];
  else next[id] = quantity;
  return Object.freeze(next);
}

export function cartLines(cart: Cart) {
  return Object.entries(cart).filter(([id]) => isProductId(id)).map(([id, quantity]) => {
    const product = getProduct(id as ProductId);
    return { product, quantity: quantity!, totalMinor: product.priceMinor * quantity! };
  });
}

export function cartCount(cart: Cart): number {
  return cartLines(cart).reduce((count, line) => count + line.quantity, 0);
}

export function cartTotal(cart: Cart): number {
  return cartLines(cart).reduce((total, line) => total + line.totalMinor, 0);
}

export function restoreCart(serialized: string | null): Cart {
  if (!serialized) return emptyCart;
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("items" in value)) return emptyCart;
    const items = value.items;
    if (!items || typeof items !== "object" || Array.isArray(items)) return emptyCart;
    let restored = emptyCart;
    for (const [id, quantity] of Object.entries(items)) {
      if (isProductId(id) && typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0 && quantity <= maxQuantity && getProduct(id).available && !isSoldOut(id)) {
        restored = setQuantity(restored, id, quantity);
      }
    }
    return restored;
  } catch {
    return emptyCart;
  }
}
