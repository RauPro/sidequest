"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cartCount } from "@/domain/cart";
import { createDemoOrder } from "@/domain/orders";
import type { LocationId } from "@/game/world/locations";
import { updateQuestProgress } from "@/features/game/quest";
import { OracleSaveForm } from "@/features/oracle/OracleSaveForm";
import { saveOracleReading } from "@/features/oracle/reading";
import { SupportPanel } from "@/features/support/SupportPanel";
import { SubscriptionForm } from "@/features/subscription/SubscriptionForm";
import { useCart } from "@/features/cart/CartProvider";
import { applyEncounterAction, chooseEncounterOption } from "./engine";
import { DialogueBox } from "./DialogueBox";
import { getEncounterNode } from "./market";
import { SidePanel } from "./SidePanel";
import type { EncounterAction, EncounterContext, EncounterState } from "./types";

function LegacyEncounter({ location, onClose, children }: { location: "camp" | "post"; onClose: () => void; children?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const title = location === "camp" ? "Camp" : "Post Office";
  return (
    <section ref={ref} className="rpg-frame legacy-encounter" role="dialog" aria-modal="false" aria-label={title} tabIndex={-1}>
      <button type="button" className="rpg-btn" onClick={onClose}>Keep exploring</button>
      {children}
      {location === "camp" ? <SupportPanel /> : <SubscriptionForm />}
    </section>
  );
}

export function EncounterHost({
  state,
  onStateChange,
  onClose,
  opener,
  onCartUpdated = () => undefined,
  onEmailSubmitted = () => undefined,
  onGotoLocation = () => undefined,
}: {
  state: EncounterState;
  onStateChange: (state: EncounterState) => void;
  onClose: () => void;
  opener: HTMLElement | null;
  onCartUpdated?: () => void;
  onEmailSubmitted?: (email: string) => void;
  onGotoLocation?: (location: LocationId) => void;
}) {
  const { cart, store } = useCart();
  const closeRef = useRef(onClose);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (state.location === "oracle" && state.nodeId === "oracle-reveal") {
      updateQuestProgress((current) => ({ ...current, oracle: true }));
    }
  }, [state.location, state.nodeId]);
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

  if (state.location === "camp" || state.location === "post") {
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
    if (action.type === "oracle-realm" && state.deskMood) {
      saveOracleReading({ mood: state.deskMood, realm: action.realm });
    }
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
    const choice = node.choices.find((item) => item.id === choiceId);
    if (
      choice?.action?.type === "goto-location" &&
      state.location === "market" &&
      state.nodeId === "market-oracle-referral"
    ) {
      onGotoLocation(choice.action.location);
      onClose();
      return;
    }
    if (choice?.action) {
      commitAction(choice.action);
      return;
    }
    const result = chooseEncounterOption(state, node, choiceId);
    onStateChange(result.state);
  };

  return (
    <div className="encounter-layout">
      <DialogueBox key={state.nodeId} node={node} onChoose={onChoose}>
        {state.location === "oracle" && state.nodeId === "oracle-save" && state.deskMood && (
          <OracleSaveForm mood={state.deskMood} onEmailSubmitted={onEmailSubmitted} />
        )}
      </DialogueBox>
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
