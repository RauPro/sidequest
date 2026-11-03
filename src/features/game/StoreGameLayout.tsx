"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cartCount } from "@/domain/cart";
import { createDemoOrder, type DemoOrder } from "@/domain/orders";
import { useCart } from "@/features/cart/CartProvider";
import { SidePanel } from "@/features/encounters/SidePanel";
import type { GameHudView } from "./GameHud";
import { GameHud } from "./GameHud";
import { trackDemoCheckout, trackStartedCheckout } from "@/features/klaviyo/track";
import { RavenLedgerPanel } from "@/features/klaviyo/RavenLedgerPanel";

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
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerOpener, setLedgerOpener] = useState<HTMLElement | null>(null);

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
      const checkoutId = crypto.randomUUID();
      trackStartedCheckout(snapshot, checkoutId);
      const order = createDemoOrder(snapshot, crypto.randomUUID());
      trackDemoCheckout(order);
      setReceipt(order);
      store.clear();
    }
  }
  const openLedger = (button: HTMLElement | null) => {
    setBagOpen(false);
    setReceipt(null);
    setLedgerOpener(button);
    setLedgerOpen(true);
  };

  return (
    <div className="store-game-shell">
      <div className="store-village-background" aria-hidden="true" />
      <GameHud
        title="Market Hall"
        view={view}
        bagOpen={bagOpen}
        ledgerOpen={ledgerOpen}
        onOpenLedger={openLedger}
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
            dialog
          />
        </div>
      )}
      {ledgerOpen && <RavenLedgerPanel opener={ledgerOpener} onClose={() => setLedgerOpen(false)} />}
    </div>
  );
}
