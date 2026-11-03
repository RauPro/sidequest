import { catalog, type ProductId } from "@/domain/catalog";
import type { Cart } from "@/domain/cart";
import type { DemoOrder } from "@/domain/orders";
import type { DeskMood, VisualStyle } from "@/domain/recommendations";
import type { LocationId } from "@/game/world/locations";
import { getRememberedEmail, maskEmail } from "./identity";
import { recordLedger, updateLedger } from "./ledger";

export type TrackProperties = {
  "Sidequest Location Visited": { location: LocationId };
  "Sidequest Product Viewed": { productId: ProductId; discoverySource: "market" | "oracle" | "shop" | "camp" };
  "Sidequest Bag Updated": { productIds: ProductId[]; quantities: number[] };
  "Sidequest Oracle Completed": { recommendedProductId: ProductId; ruleVersion: "2"; deskMood: DeskMood; visualStyle: VisualStyle };
  "Sidequest Camp Question Asked": { topic: "companion" | "checkout" | "shipping" | "custom" };
  "Sidequest Demo Checkout Completed": { productIds: ProductId[]; quantities: number[]; demoTotalMinor: number; currency: "USD"; demoOrderId: string };
};

const tracked = new Set<string>();
const trackedKey = "sidequest:events:v1";

export function trackEvent<E extends keyof TrackProperties>(event: E, properties: TrackProperties[E]) {
  const email = getRememberedEmail();
  if (!email) {
    recordLedger({
      channel: "server",
      operation: "event",
      label: event,
      status: "skipped",
      detail: "No remembered email address is available.",
    });
    return;
  }
  const recipient = maskEmail(email);
  const ledgerId = recordLedger({
    channel: "server",
    operation: "event",
    label: event,
    status: "sent",
    detail: `Recipient ${recipient}`,
  });
  try {
    const eventId = crypto.randomUUID();
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, eventId, email, properties }),
      keepalive: true,
    }).then(async (response) => {
      const result = await response.json().catch(() => null) as { status?: unknown } | null;
      if (result?.status === "simulated") {
        updateLedger(ledgerId, { status: "simulated", detail: `Simulated in demo mode. Recipient ${recipient}.` });
      } else if (response.status === 202 && result?.status === "accepted") {
        updateLedger(ledgerId, { status: "accepted", detail: `Klaviyo accepted the event request. Recipient ${recipient}.` });
      } else if (!response.ok) {
        updateLedger(ledgerId, { status: "failed", detail: `The event request was not accepted. Recipient ${recipient}.` });
      } else {
        updateLedger(ledgerId, { status: "sent", detail: `Request completed without a 202 acceptance response. Recipient ${recipient}.` });
      }
    }).catch(() => {
      updateLedger(ledgerId, { status: "failed", detail: `The event request could not be confirmed. Recipient ${recipient}.` });
    });
  } catch {
    updateLedger(ledgerId, { status: "failed", detail: `The event request could not be started. Recipient ${recipient}.` });
  }
}

export function trackEventOnce<E extends keyof TrackProperties>(
  key: string,
  event: E,
  properties: TrackProperties[E],
) {
  try {
    if (window.sessionStorage.getItem(trackedKey)?.split("|").includes(key)) return;
    const current = window.sessionStorage.getItem(trackedKey)?.split("|").filter(Boolean) ?? [];
    window.sessionStorage.setItem(trackedKey, [...new Set([...current, key])].join("|"));
  } catch {
    if (tracked.has(key)) return;
    tracked.add(key);
  }
  trackEvent(event, properties);
}

export function trackBagUpdated(cart: Cart) {
  const lines = catalog.flatMap(({ id }) => cart[id] ? [{ productId: id, quantity: cart[id]! }] : []);
  trackEvent("Sidequest Bag Updated", {
    productIds: lines.map((line) => line.productId),
    quantities: lines.map((line) => line.quantity),
  });
}

export function trackDemoCheckout(order: DemoOrder) {
  trackEvent("Sidequest Demo Checkout Completed", {
    productIds: order.lines.map((line) => line.productId),
    quantities: order.lines.map((line) => line.quantity),
    demoTotalMinor: order.totalMinor,
    currency: order.currency,
    demoOrderId: order.id,
  });
}
