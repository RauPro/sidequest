"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cartCount } from "@/domain/cart";
import { createDemoOrder, type DemoOrder } from "@/domain/orders";
import { useCart } from "@/features/cart/CartProvider";
import { SidePanel } from "@/features/encounters/SidePanel";
import type { GameHudView } from "./GameHud";
import { GameHud } from "./GameHud";

export function StoreGameLayout({
  children,
  view,
}: {
  children: ReactNode;
  view: Exclude<GameHudView, "village">;
}) {
  const { cart, store } = useCart();
  const [bagOpen, setBagOpen] = useState(false);
  const [receipt, setReceipt] = useState<DemoOrder | null>(null);
  const [opener, setOpener] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!bagOpen) return;
    document.querySelector<HTMLElement>(".store-bag-panel [role='dialog']")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBagOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (opener?.isConnected) opener.focus();
    };
  }, [bagOpen, opener]);

  function handleAction(action: { type: string }) {
    if (action.type === "close") {
      setReceipt(null);
      setBagOpen(false);
    }
    if (action.type === "checkout") {
      const snapshot = store.getSnapshot();
      if (!cartCount(snapshot)) return;
      setReceipt(createDemoOrder(snapshot, crypto.randomUUID()));
      store.clear();
    }
  }

  return (
    <div className="store-game-shell">
      <div className="store-village-background" aria-hidden="true" />
      <GameHud
        title="Market Hall"
        view={view}
        bagOpen={bagOpen}
        onOpenBag={(event) => {
          if (bagOpen) {
            setBagOpen(false);
            return;
          }
          setOpener(event.currentTarget);
          setReceipt(null);
          setBagOpen(true);
        }}
      />
      <main id="main" className="store-main">{children}</main>
      {bagOpen && (
        <div className="store-bag-panel">
          <SidePanel
            side={receipt ? { kind: "receipt" } : { kind: "bag" }}
            cart={cart}
            store={store}
            receipt={receipt}
            onAction={(action) => handleAction(action)}
            onCartUpdated={() => undefined}
            dialog
          />
        </div>
      )}
    </div>
  );
}
