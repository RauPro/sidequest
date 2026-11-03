"use client";

import Image from "next/image";
import { cartLines, cartTotal, maxQuantity } from "@/domain/cart";
import { formatMoney, getProduct } from "@/domain/catalog";
import type { CartStore } from "@/features/cart/store";
import type { DemoOrder } from "@/domain/orders";
import type { EncounterAction, SideView } from "./types";

const companionTraits = {
  ember: { subtitle: "Brave desk companion", traits: ["Brave", "Warm", "Fire"] },
  moss: { subtitle: "Gentle desk companion", traits: ["Calm", "Soft", "Nature"] },
  bolt: { subtitle: "Curious desk companion", traits: ["Curious", "Clever", "Technology"] },
} as const;

export function SidePanel({
  side,
  cart,
  store,
  receipt,
  onAction,
  onCartUpdated,
}: {
  side: SideView;
  cart: ReturnType<CartStore["getSnapshot"]>;
  store: CartStore;
  receipt: DemoOrder | null;
  onAction: (action: EncounterAction) => void;
  onCartUpdated: () => void;
}) {
  if (!side) return null;
  if (side.kind === "product") {
    const product = getProduct(side.productId);
    const details = companionTraits[product.id];
    return (
      <aside className="rpg-frame side-panel product-side-panel" aria-label={`${product.name} details`}>
        <p className="side-panel-eyebrow">COMPANION</p>
        <h2>{product.name}</h2>
        <p className="product-subtitle">{details.subtitle}</p>
        <div className="product-art-glow" style={{ background: `radial-gradient(circle, ${product.color}88 0%, transparent 70%)` }}>
          <Image src={`/game/products/${product.id}.png`} alt={`${product.name} companion`} width={160} height={160} className="game-image" />
        </div>
        <ul className="product-traits">{details.traits.map((trait) => <li key={trait}>{trait}</li>)}</ul>
        <p>{product.description}</p>
        <p className="product-price">{formatMoney(product.priceMinor)}</p>
        <button type="button" className="rpg-btn rpg-btn--primary" onClick={() => onAction({ type: "add-to-bag", productId: product.id })}>
          Add to bag
        </button>
        {side.browsing && (
          <div className="product-carousel">
            <button type="button" className="rpg-btn" onClick={() => onAction({ type: "browse-previous" })}>Previous</button>
            <button type="button" className="rpg-btn" onClick={() => onAction({ type: "browse-next" })}>Next</button>
          </div>
        )}
        <button type="button" className="rpg-btn side-keep-exploring" onClick={() => onAction({ type: "close" })}>Keep exploring</button>
      </aside>
    );
  }

  if (side.kind === "bag") {
    const lines = cartLines(cart);
    return (
      <aside className="rpg-frame side-panel bag-side-panel" role="region" aria-label="Your backpack">
        <p className="side-panel-eyebrow">YOUR BACKPACK</p>
        <h2>Your backpack</h2>
        {!lines.length && <p>Your bag is empty. Browse the companions?</p>}
        {lines.map(({ product, quantity, totalMinor }) => (
          <div className="bag-line" key={product.id}>
            <div className="bag-line-name">{product.name}<span>{formatMoney(product.priceMinor)} each</span></div>
            <div className="bag-line-actions">
              <button type="button" className="rpg-btn" aria-label={`Remove one ${product.name}`} onClick={() => { store.set(product.id, quantity - 1); onCartUpdated(); }}>−</button>
              <span aria-label={`${product.name} quantity`}>{quantity}</span>
              <button type="button" className="rpg-btn" aria-label={`Add one ${product.name}`} disabled={quantity >= maxQuantity} onClick={() => { store.add(product.id); onCartUpdated(); }}>+</button>
              <button type="button" className="rpg-btn" onClick={() => { store.set(product.id, 0); onCartUpdated(); }}>Remove {product.name}</button>
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
    <aside className="rpg-frame side-panel receipt-side-panel" role="region" aria-label="Demo order receipt">
      <p className="side-panel-eyebrow">DEMO RECEIPT</p>
      <h2>Order snapshot</h2>
      {receipt?.lines.map((line) => (
        <p key={line.productId}>{line.quantity} × {line.name} · {formatMoney(line.unitMinor * line.quantity)}</p>
      ))}
      {receipt && <p><strong>Total: {formatMoney(receipt.totalMinor)}</strong></p>}
      <p className="demo-notice">Demo checkout: no payment, no delivery.</p>
      <button type="button" className="rpg-btn side-keep-exploring" onClick={() => onAction({ type: "close" })}>Keep exploring</button>
    </aside>
  );
}
