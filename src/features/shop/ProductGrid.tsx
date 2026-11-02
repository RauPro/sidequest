"use client";

import { catalog, formatMoney } from "@/domain/catalog";
import { maxQuantity } from "@/domain/cart";
import { useCart } from "@/features/cart/CartProvider";

export function ProductGrid() {
  const { cart, store } = useCart();
  return <div className="products">{catalog.map((product) => <article className="product" key={product.id}>
    <div className="product-mark" style={{ backgroundColor: product.color }} aria-hidden="true">{product.name[0]}</div>
    <h3>{product.name}</h3><p>{product.description}</p><strong>{formatMoney(product.priceMinor)}</strong>
    <button onClick={() => store.add(product.id)} disabled={!product.available || (cart[product.id] ?? 0) >= maxQuantity}>Add {product.name}</button>
  </article>)}</div>;
}
