"use client";

import { useRef, useState } from "react";
import { createDemoOrder, type DemoOrder } from "@/domain/orders";
import { cartCount } from "@/domain/cart";
import { formatMoney } from "@/domain/catalog";
import { useCart } from "@/features/cart/CartProvider";

export function DemoCheckout() {
  const { cart, store } = useCart();
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const completing = useRef(false);
  function complete() {
    if (completing.current || !cartCount(store.getSnapshot())) return;
    completing.current = true;
    setOrder(createDemoOrder(store.getSnapshot(), crypto.randomUUID()));
    store.clear();
  }
  if (order) return <div role="status">
    <p><strong>Demo order complete.</strong> No payment was taken.</p>
    <p>{order.lines.map((line) => `${line.quantity} × ${line.name}`).join(", ")} · {formatMoney(order.totalMinor)}</p>
    <button onClick={() => { completing.current = false; setOrder(null); }}>Start another demo order</button>
  </div>;
  return <><p className="muted">Review the bag above. This checkout is simulated; no payment or delivery takes place.</p>
    <button disabled={!cartCount(cart)} onClick={complete}>Complete demo checkout</button></>;
}
