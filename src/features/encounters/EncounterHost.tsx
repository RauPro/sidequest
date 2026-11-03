"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cartCount } from "@/domain/cart";
import { createDemoOrder } from "@/domain/orders";
import { OraclePanel } from "@/features/oracle/OraclePanel";
import { SupportPanel } from "@/features/support/SupportPanel";
import { SubscriptionForm } from "@/features/subscription/SubscriptionForm";
import { useCart } from "@/features/cart/CartProvider";
import { applyEncounterAction, chooseEncounterOption } from "./engine";
import { DialogueBox } from "./DialogueBox";
import { getEncounterNode } from "./market";
import { SidePanel } from "./SidePanel";
import type { EncounterAction, EncounterContext, EncounterState } from "./types";

function LegacyEncounter({ location, onClose, children }: { location: "oracle" | "camp" | "post"; onClose: () => void; children?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const title = location === "oracle" ? "The Oracle" : location === "camp" ? "Camp" : "Post Office";
  return (
    <section ref={ref} className="rpg-frame legacy-encounter" role="dialog" aria-modal="false" aria-label={title} tabIndex={-1}>
      <button type="button" className="rpg-btn" onClick={onClose}>Keep exploring</button>
      {children}
      {location === "oracle" ? <OraclePanel /> : location === "camp" ? <SupportPanel /> : <SubscriptionForm />}
    </section>
  );
}

export function EncounterHost({
  state,
  onStateChange,
  onClose,
  opener,
  onCartUpdated = () => undefined,
}: {
  state: EncounterState;
  onStateChange: (state: EncounterState) => void;
  onClose: () => void;
  opener: HTMLElement | null;
  onCartUpdated?: () => void;
}) {
  const { cart, store } = useCart();
  const closeRef = useRef(onClose);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [opener]);

  if (state.location && state.location !== "market" && state.location !== "bag") {
    return <LegacyEncounter location={state.location} onClose={onClose} />;
  }

  const context: EncounterContext = {
    productId: state.productId,
    cartCount: cartCount(cart),
    receipt: state.receipt,
  };
  const node = getEncounterNode(state, context);
  if (!node) return null;

  const commitAction = (action: EncounterAction) => {
    const result = applyEncounterAction(state, action);
    let nextState = result.state;
    if (result.effect?.type === "add-to-bag") {
      store.add(result.effect.productId ?? state.productId);
      onCartUpdated();
    }
    if (result.effect?.type === "checkout") {
      const snapshot = store.getSnapshot();
      if (cartCount(snapshot) === 0) return;
      const order = createDemoOrder(snapshot, crypto.randomUUID());
      store.clear();
      onCartUpdated();
      nextState = { ...nextState, receipt: order };
    }
    onStateChange(nextState);
  };

  const onChoose = (choiceId: string) => {
    const result = chooseEncounterOption(state, node, choiceId);
    if (result.effect) commitAction(result.effect);
    else onStateChange(result.state);
  };

  return (
    <div className="encounter-layout">
      <DialogueBox key={state.nodeId} node={node} onChoose={onChoose} />
      <SidePanel
        side={node.side ?? null}
        cart={cart}
        store={store}
        receipt={state.receipt}
        onAction={commitAction}
        onCartUpdated={onCartUpdated}
      />
    </div>
  );
}
