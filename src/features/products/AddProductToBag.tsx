"use client";

import Link from "next/link";
import { useState } from "react";
import { maxQuantity } from "@/domain/cart";
import { getProduct, type ProductId } from "@/domain/catalog";
import { useCart } from "@/features/cart/CartProvider";
import styles from "./product-page.module.css";

export function AddProductToBag({ id }: { id: ProductId }) {
  const { cart, store } = useCart();
  const [message, setMessage] = useState("");
  const product = getProduct(id);
  const atLimit = (cart[id] ?? 0) >= maxQuantity;

  function add() {
    if (!product.available || (store.getSnapshot()[id] ?? 0) >= maxQuantity) return;
    store.add(id);
    setMessage(`${product.name} added to your bag.`);
  }

  return (
    <div className={styles.purchase}>
      <button className={styles.addButton} onClick={add} disabled={!product.available || atLimit}>
        {!product.available ? "Currently unavailable" : atLimit ? "Bag limit reached" : `Add ${product.name} to bag`}
      </button>
      <Link href="/shop">View bag in Shop view →</Link>
      <p className={styles.feedback} role="status">{message}</p>
    </div>
  );
}
