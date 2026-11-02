"use client";

import { cartCount } from "@/domain/cart";
import { useCart } from "./CartProvider";

export function BagCount() {
  const { cart } = useCart();
  return <span aria-live="polite">Bag · {cartCount(cart)}</span>;
}
