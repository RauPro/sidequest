"use client";

import { useEffect, useRef, useState } from "react";
import { cartCount } from "@/domain/cart";
import { createDemoOrder } from "@/domain/orders";
import type { LocationId } from "@/game/world/locations";
import { updateQuestProgress } from "@/features/game/quest";
import { OracleSaveForm } from "@/features/oracle/OracleSaveForm";
import { saveOracleReading } from "@/features/oracle/reading";
import { CampChatPanel } from "./CampChatPanel";
import { PostOfficeForm } from "@/features/subscription/PostOfficeForm";
import { useCart } from "@/features/cart/CartProvider";
import { applyEncounterAction, chooseEncounterOption, createEncounterState } from "./engine";
import { DialogueBox } from "./DialogueBox";
import { getEncounterNode } from "./market";
import { SidePanel } from "./SidePanel";
import type { EncounterAction, EncounterContext, EncounterState } from "./types";
import type { CampTopic } from "@/domain/campGuide";
import { trackBagUpdated, trackDemoCheckout, trackEvent, trackEventOnce } from "@/features/klaviyo/track";

export function EncounterHost({
  state,
  onStateChange,
  onClose,
  opener,
  onCartUpdated = () => undefined,
  onEmailSubmitted = () => undefined,
  identityEmail = null,
  onForgetIdentity = () => undefined,
  onGotoLocation = () => undefined,
}: {
  state: EncounterState;
  onStateChange: (state: EncounterState) => void;
  onClose: () => void;
  opener: HTMLElement | null;
  onCartUpdated?: () => void;
  onEmailSubmitted?: (email: string) => void;
  identityEmail?: string | null;
  onForgetIdentity?: () => void;
  onGotoLocation?: (location: LocationId) => void;
}) {
  const { cart, store } = useCart();
  const closeRef = useRef(onClose);
  const [campMessages, setCampMessages] = useState<{ role: "user" | "agent"; content: string }[]>([]);
  const [campConversationId, setCampConversationId] = useState<string>();
  const [campPending, setCampPending] = useState(false);
  const [campFollowUp, setCampFollowUp] = useState(false);
  const [campEmailChoiceMade, setCampEmailChoiceMade] = useState(false);
  const [campPendingTurn, setCampPendingTurn] = useState<{ content: string; topic: CampTopic } | null>(null);

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

  const context: EncounterContext = {
    productId: state.productId,
    cartCount: cartCount(cart),
    receipt: state.receipt,
  };
  const node = getEncounterNode(state, context);
  if (!node) return null;

  const sendCampMessage = async (content: string, topic: CampTopic, email?: string) => {
    if (campPending || state.location !== "camp" || state.nodeId === "camp-handoff") return;
    trackEvent("Sidequest Camp Question Asked", { topic });
    const messages = [...campMessages, { role: "user" as const, content }].slice(-20);
    setCampMessages(messages);
    setCampPending(true);
    try {
      const response = await fetch("/api/camp/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(campConversationId ? { conversationId: campConversationId } : {}),
          messages,
          ...((email ?? identityEmail) ? { email: email ?? identityEmail } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Finn could not answer right now.");
      if (result.conversationId) setCampConversationId(result.conversationId);
      if (result.followUp === true) setCampFollowUp(true);
      const replies: { role: "agent"; content: string }[] = [];
      let nextNode: string | null = null;
      let productReply: import("@/domain/campGuide").CampReply | null = null;
      for (const reply of result.replies ?? []) {
        if (reply.kind === "message" && typeof reply.text === "string") {
          replies.push({ role: "agent", content: reply.text });
        } else if (reply.kind === "product" && typeof reply.title === "string") {
          productReply = reply;
          if (reply.productId) {
            trackEventOnce(`product:camp:${reply.productId}`, "Sidequest Product Viewed", {
              productId: reply.productId,
              discoverySource: "camp",
            });
          }
          replies.push({ role: "agent", content: `I found ${reply.title} in the Market.` });
          if (reply.productId) nextNode = "camp-product";
        } else if (reply.kind === "handoff" && result.status === "live") {
          const followUp = campFollowUp || result.followUp === true;
          replies.push({ role: "agent", content: followUp
            ? "I've passed this to the village team — they'll follow up by email. This chat is closed."
            : "I've passed this to the village team. This chat is closed — share your email when you start a new chat if you'd like a follow-up." });
          nextNode = "camp-handoff";
        } else if (reply.kind === "auth-required") {
          replies.push({ role: "agent", content: "Sign-in isn't available in this demo village." });
          nextNode = "camp-auth-required";
        }
      }
      setCampMessages([...messages, ...replies].slice(-20));
      if (nextNode) onStateChange({ ...state, nodeId: nextNode, campReply: productReply });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Finn could not answer right now.";
      setCampMessages([...messages, { role: "agent" as const, content: text }].slice(-20));
    } finally {
      setCampPending(false);
    }
  };

  const commitAction = (action: EncounterAction) => {
    const result = applyEncounterAction(state, action);
    let nextState = result.state;
    if (action.type === "oracle-realm" && state.deskMood) {
      saveOracleReading({ mood: state.deskMood, realm: action.realm });
      if (result.state.recommendedProductId) {
        trackEvent("Sidequest Oracle Completed", {
          recommendedProductId: result.state.recommendedProductId,
          ruleVersion: "2",
          deskMood: state.deskMood,
          visualStyle: action.realm,
        });
        trackEventOnce(`product:oracle:${result.state.recommendedProductId}`, "Sidequest Product Viewed", {
          productId: result.state.recommendedProductId,
          discoverySource: "oracle",
        });
      }
    }
    if (state.location === "oracle" && (action.type === "oracle-show-alternate" || action.type === "oracle-show-primary")) {
      trackEventOnce(`product:oracle:${result.state.productId}`, "Sidequest Product Viewed", {
        productId: result.state.productId,
        discoverySource: "oracle",
      });
    }
    if (state.location === "market" && (action.type === "browse-next" || action.type === "browse-prev")) {
      trackEventOnce(`product:market:${result.state.productId}`, "Sidequest Product Viewed", {
        productId: result.state.productId,
        discoverySource: "market",
      });
    }
    if (result.effect?.type === "add-to-bag") {
      store.add(result.effect.productId ?? state.productId);
      trackBagUpdated(store.getSnapshot());
      onCartUpdated();
    }
    if (result.effect?.type === "checkout") {
      const snapshot = store.getSnapshot();
      if (cartCount(snapshot) === 0) return;
      const order = createDemoOrder(snapshot, crypto.randomUUID());
      trackDemoCheckout(order);
      store.clear();
      trackBagUpdated(store.getSnapshot());
      onCartUpdated();
      nextState = { ...nextState, receipt: order };
    }
    onStateChange(nextState);
  };

  const onChoose = (choiceId: string) => {
    const choice = node.choices.find((item) => item.id === choiceId);
    if (choice?.action?.type === "send-chat" && state.location === "camp") {
      if (!campPending) submitCampTurn(choice.action.content, choice.action.topic);
      return;
    }
    if (choice?.action?.type === "camp-email-skip" && state.location === "camp") {
      const pendingTurn = campPendingTurn;
      setCampEmailChoiceMade(true);
      setCampPendingTurn(null);
      onStateChange({ ...state, nodeId: "camp-start" });
      if (pendingTurn && !campPending) void sendCampMessage(pendingTurn.content, pendingTurn.topic, identityEmail ?? undefined);
      return;
    }
    if (choice?.action?.type === "camp-reset") {
      setCampMessages([]);
      setCampConversationId(undefined);
      setCampFollowUp(false);
      setCampEmailChoiceMade(false);
      setCampPendingTurn(null);
    }
    if (
      choice?.action?.type === "goto-location" &&
      choice.action.location === "market" &&
      state.location === "camp" &&
      state.nodeId === "camp-product" &&
      state.campReply?.kind === "product" &&
      state.campReply.productId
    ) {
      onStateChange({ ...createEncounterState("market"), nodeId: "market-browse", productId: state.campReply.productId });
      trackEventOnce(`location:market`, "Sidequest Location Visited", { location: "market" });
      trackEventOnce(`product:market:${state.campReply.productId}`, "Sidequest Product Viewed", {
        productId: state.campReply.productId,
        discoverySource: "market",
      });
      return;
    }
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
    if (result.state.location === "market" && result.state.nodeId === "market-browse") {
      trackEventOnce(`product:market:${result.state.productId}`, "Sidequest Product Viewed", {
        productId: result.state.productId,
        discoverySource: "market",
      });
    }
    onStateChange(result.state);
  };

  function submitCampTurn(content: string, topic: CampTopic, email?: string) {
    if (state.location !== "camp" || campPending) return;
    if (state.nodeId === "camp-custom") {
      setCampEmailChoiceMade(true);
      if (email) onEmailSubmitted(email);
      void sendCampMessage(content, topic, email);
      return;
    }
    if (!campEmailChoiceMade && !identityEmail && !email && !campConversationId) {
      setCampPendingTurn({ content, topic });
      onStateChange({ ...state, nodeId: "camp-email" });
      return;
    }
    setCampEmailChoiceMade(true);
    if (email) onEmailSubmitted(email);
    void sendCampMessage(content, topic, email ?? identityEmail ?? undefined);
  }

  return (
    <div className="encounter-layout">
      <DialogueBox key={state.nodeId} node={node} onChoose={onChoose}>
        {state.location === "oracle" && state.nodeId === "oracle-save" && state.deskMood && (
          <OracleSaveForm mood={state.deskMood} onEmailSubmitted={onEmailSubmitted} identityEmail={identityEmail} onForgetIdentity={onForgetIdentity} />
        )}
        {state.location === "post" && (
          <PostOfficeForm onEmailSubmitted={onEmailSubmitted} identityEmail={identityEmail} onForgetIdentity={onForgetIdentity} />
        )}
        {state.location === "camp" && (
          <CampChatPanel
            stage={state.nodeId}
            messages={campMessages}
            pending={campPending}
            identityEmail={identityEmail}
            allowEmailPrompt={!campEmailChoiceMade}
            onForgetIdentity={onForgetIdentity}
            onSkipEmail={() => setCampEmailChoiceMade(true)}
            onSend={(content, email) => submitCampTurn(content, "custom", email)}
            onEmailChoice={(email) => {
              const pendingTurn = campPendingTurn;
              setCampEmailChoiceMade(true);
              setCampPendingTurn(null);
              if (email && email !== identityEmail) onEmailSubmitted(email);
              onStateChange({ ...state, nodeId: "camp-start" });
              if (pendingTurn && !campPending) {
                void sendCampMessage(pendingTurn.content, pendingTurn.topic, email ?? identityEmail ?? undefined);
              }
            }}
          />
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
