"use client";

import { cartLines, cartTotal, maxQuantity } from "@/domain/cart";
import { formatMoney } from "@/domain/catalog";
import { Panel } from "@/components/ui/Panel";
import { DemoCheckout } from "@/features/checkout/DemoCheckout";
import { useCart } from "./CartProvider";

export function CartPanel() {
  const { cart, store } = useCart();
  const lines = cartLines(cart);
  return <Panel title="Your backpack">
    {!lines.length && <p>Your bag is empty. Choose a companion above.</p>}
    {lines.map(({ product, quantity, totalMinor }) => <div className="cart-line" key={product.id}>
      <span>{product.name} · {formatMoney(product.priceMinor)} each</span>
      <div className="quantity">
        <button aria-label={`Remove one ${product.name}`} onClick={() => store.set(product.id, quantity - 1)}>−</button>
        <span aria-label={`${product.name} quantity`}>{quantity}</span>
        <button aria-label={`Add one ${product.name}`} disabled={quantity >= maxQuantity} onClick={() => store.add(product.id)}>+</button>
        <button onClick={() => store.set(product.id, 0)}>Remove {product.name}</button>
      </div><strong>{formatMoney(totalMinor)}</strong>
    </div>)}
    <p><strong>Total: {formatMoney(cartTotal(cart))}</strong></p><DemoCheckout />
  </Panel>;
}
