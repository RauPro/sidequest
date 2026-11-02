"use client";

import { useEffect, useRef } from "react";
import { ProductGrid } from "@/features/shop/ProductGrid";
import { OraclePanel } from "@/features/oracle/OraclePanel";
import { SupportPanel } from "@/features/support/SupportPanel";
import { SubscriptionForm } from "@/features/subscription/SubscriptionForm";
import { CartPanel } from "@/features/cart/CartPanel";
import { Panel } from "@/components/ui/Panel";
import type { LocationId } from "@/game/world/locations";

const titles: Record<LocationId | "bag", string> = {
  market: "Market",
  oracle: "The Oracle",
  camp: "Camp",
  post: "Post Office",
  bag: "Your backpack",
};

export function GamePanel({ panel, onClose, opener }: { panel: LocationId | "bag"; onClose: () => void; opener: HTMLElement | null }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const back = opener;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      back?.focus();
    };
  }, [onClose, opener]);
  return <section ref={ref} className="game-panel" role="dialog" aria-modal="false" aria-label={titles[panel]} tabIndex={-1}>
    <button className="panel-close" onClick={onClose}>Keep exploring</button>
    {panel === "market" && <Panel title="Market"><p className="muted">Fictional demo companions.</p><ProductGrid /></Panel>}
    {panel === "oracle" && <OraclePanel />}
    {panel === "camp" && <SupportPanel />}
    {panel === "post" && <SubscriptionForm />}
    {panel === "bag" && <CartPanel />}
  </section>;
}
