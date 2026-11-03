"use client";

import Image from "next/image";
import { cartLines, cartTotal, maxQuantity, type Cart } from "@/domain/cart";
import { formatMoney, getProduct, productIds, type ProductId } from "@/domain/catalog";
import { productCopy } from "@/features/products/product-copy";
import type { CartStore } from "@/features/cart/store";
import type { DemoOrder } from "@/domain/orders";
import type { EncounterAction, SideView } from "./types";
import { trackAddedToCart } from "@/features/klaviyo/track";

export function SidePanel({
  side,
  cart,
  store,
  receipt,
  onAction,
  dialog = false,
}: {
  side: SideView;
  cart: ReturnType<CartStore["getSnapshot"]>;
  store: CartStore;
  receipt: DemoOrder | null;
  onAction: (action: EncounterAction) => void;
  dialog?: boolean;
}) {
  function cartChanged(previousCart: Cart, productId: ProductId) {
    trackAddedToCart(previousCart, store.getSnapshot(), productId);
  }

  if (!side) return null;
  if (side.kind === "product") {
    const product = getProduct(side.productId);
    const copy = productCopy[product.id];
    return (
      <aside className="rpg-frame side-panel product-side-panel" aria-label={`${product.name} details`}>
        <p className="side-panel-eyebrow">COMPANION</p>
        <h2>{product.name}</h2>
        <p className="product-subtitle">{copy.subtitle}</p>
        <div className="product-art-glow" style={{ background: `radial-gradient(circle, ${product.color}88 0%, transparent 70%)` }}>
          <Image src={`/game/products/${product.id}.png`} alt={`${product.name} companion`} width={160} height={160} className="game-image" />
        </div>
        <ul className="product-traits">{copy.traits.map((trait) => <li key={trait}>{trait}</li>)}</ul>
        <p className="product-description">{copy.description}</p>
        <p className="product-price">{formatMoney(product.priceMinor)}</p>
        <button type="button" className="rpg-btn rpg-btn--primary" onClick={() => onAction({ type: "add-to-bag", productId: product.id })}>
          Add to bag
        </button>
        {side.browsing && (
          <div className="product-carousel">
            <button type="button" className="rpg-btn" aria-label="Previous companion" onClick={() => onAction({ type: "browse-prev" })}>◀</button>
            <span>{productIds.indexOf(product.id) + 1}/3</span>
            <button type="button" className="rpg-btn" aria-label="Next companion" onClick={() => onAction({ type: "browse-next" })}>▶</button>
          </div>
        )}
        <button type="button" className="rpg-btn side-keep-exploring" onClick={() => onAction({ type: "close" })}>Keep exploring</button>
      </aside>
    );
  }

  if (side.kind === "bag") {
    const lines = cartLines(cart);
    return (
      <aside className="rpg-frame side-panel bag-side-panel" role={dialog ? "dialog" : "region"} aria-modal={dialog ? "false" : undefined} aria-label="Your backpack" tabIndex={dialog ? -1 : undefined}>
        <p className="side-panel-eyebrow">YOUR BACKPACK</p>
        <h2>Your backpack</h2>
        {!lines.length && <p>Your bag is empty. Browse the companions?</p>}
        {lines.map(({ product, quantity, totalMinor }) => (
          <div className="bag-line" key={product.id}>
            <div className="bag-line-name">{product.name}<span>{formatMoney(product.priceMinor)} each</span></div>
            <div className="bag-line-actions">
              <button type="button" className="rpg-btn" aria-label={`Remove one ${product.name}`} onClick={() => store.set(product.id, quantity - 1)}>−</button>
              <span aria-label={`${product.name} quantity`}>{quantity}</span>
              <button type="button" className="rpg-btn" aria-label={`Add one ${product.name}`} disabled={quantity >= maxQuantity} onClick={() => { const previousCart = store.getSnapshot(); store.add(product.id); cartChanged(previousCart, product.id); }}>+</button>
              <button type="button" className="rpg-btn" onClick={() => store.set(product.id, 0)}>Remove {product.name}</button>
            </div>
            <strong>{formatMoney(totalMinor)}</strong>
          </div>
        ))}
        <p className="bag-total"><strong>Total: {formatMoney(cartTotal(cart))}</strong></p>
        <p className="demo-notice">Demo checkout: no payment, no delivery.</p>
        <button type="button" className="rpg-btn rpg-btn--primary" disabled={!lines.length} onClick={() => onAction({ type: "checkout" })}>
          Check out
        </button>
        <button type="button" className="rpg-btn side-keep-exploring" onClick={() => onAction({ type: "close" })}>Keep exploring</button>
      </aside>
    );
  }

  return (
    <aside className="rpg-frame side-panel receipt-side-panel" role={dialog ? "dialog" : "region"} aria-modal={dialog ? "false" : undefined} aria-label="Demo order receipt" tabIndex={dialog ? -1 : undefined}>
      <p className="side-panel-eyebrow">DEMO RECEIPT</p>
      <h2>Order snapshot</h2>
      {receipt && <p>Demo order · {receipt.id.slice(0, 8)}</p>}
      {receipt?.lines.map((line) => (
        <p key={line.productId}>{line.quantity} × {line.name} · {formatMoney(line.unitMinor * line.quantity)}</p>
      ))}
      {receipt && <p><strong>Total: {formatMoney(receipt.totalMinor)}</strong></p>}
      <p className="demo-notice">Demo checkout: no payment, no delivery.</p>
      <button type="button" className="rpg-btn side-keep-exploring" onClick={() => onAction({ type: "close" })}>Keep exploring</button>
    </aside>
  );
}
