"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";
import { cartCount } from "@/domain/cart";
import { useCart } from "@/features/cart/CartProvider";
import { useLedger } from "@/features/klaviyo/ledger";

export type GameHudView = "village" | "shop" | "product";

export function GameHud({
  title,
  view,
  onOpenBag,
  onOpenLedger,
  bagOpen = false,
  ledgerOpen = false,
}: {
  title: string;
  view: GameHudView;
  onOpenBag: (event: MouseEvent<HTMLButtonElement>) => void;
  onOpenLedger: (opener: HTMLElement | null) => void;
  bagOpen?: boolean;
  ledgerOpen?: boolean;
}) {
  const { cart } = useCart();
  const count = cartCount(cart);
  const ledger = useLedger();
  const ledgerButton = useRef<HTMLButtonElement>(null);
  const village = view === "village";

  useEffect(() => {
    if (ledgerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "l" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")) return;
      event.preventDefault();
      onOpenLedger(ledgerButton.current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ledgerOpen, onOpenLedger]);

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
        <button
          ref={ledgerButton}
          type="button"
          className="rpg-btn rpg-ravens-button"
          aria-label={`Ravens, ${ledger.length} ${ledger.length === 1 ? "message" : "messages"}`}
          aria-haspopup="dialog"
          aria-expanded={ledgerOpen}
          data-ledger-button
          onClick={() => onOpenLedger(ledgerButton.current)}
        >
          <svg
            className="rpg-ravens-icon"
            aria-hidden="true"
            focusable="false"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            shapeRendering="crispEdges"
          >
            <path d="M13 1h2v3h-1v2h-1v2h-2v2h-2v2H7v2H5v1H2v-3h2v-2h2v-2h2V8h2V6h2V4h1z" />
            <path d="M3 13h2v1H2v-2h1z" />
          </svg>
          <span className="rpg-ravens-label">Ravens</span>
          <span className="rpg-ravens-count" aria-hidden="true">{ledger.length}</span>
        </button>
        <Link className="rpg-btn rpg-nav-link" href={village ? "/shop" : "/"}>
          {village ? "Shop view" : "Village"}
        </Link>
      </nav>
    </header>
  );
}
