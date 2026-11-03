"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { cartCount } from "@/domain/cart";
import { useCart } from "@/features/cart/CartProvider";

export type GameHudView = "village" | "shop" | "product";

export function GameHud({
  title,
  view,
  onOpenBag,
  bagOpen = false,
}: {
  title: string;
  view: GameHudView;
  onOpenBag: (event: MouseEvent<HTMLButtonElement>) => void;
  bagOpen?: boolean;
}) {
  const { cart } = useCart();
  const count = cartCount(cart);
  const village = view === "village";

  return (
    <header className="rpg-hud">
      <Link className="rpg-brand" href="/" aria-label="SIDEQUEST home">
        <Image
          src="/game/products/ember.png"
          alt=""
          width={28}
          height={28}
          className="game-image rpg-brand-icon"
          aria-hidden="true"
        />
        <span>SIDEQUEST</span>
      </Link>
      <div className="rpg-hud-title" aria-label={title}>
        <span aria-hidden="true">◆ {title} ◆</span>
      </div>
      <nav className="rpg-hud-actions" aria-label="Game navigation">
        <button
          type="button"
          className="rpg-btn rpg-bag-button"
          aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
          aria-haspopup="dialog"
          aria-expanded={bagOpen}
          onClick={onOpenBag}
        >
          <span aria-hidden="true">▣</span>
          <span>Bag</span>
          <span className="rpg-bag-count" aria-hidden="true">{count}</span>
        </button>
        <Link className="rpg-btn rpg-nav-link" href={village ? "/shop" : "/"}>
          {village ? "Shop view" : "Village"}
        </Link>
      </nav>
    </header>
  );
}
