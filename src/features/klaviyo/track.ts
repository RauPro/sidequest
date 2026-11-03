import { catalog, type ProductId } from "@/domain/catalog";
import type { Cart } from "@/domain/cart";
import type { DemoOrder } from "@/domain/orders";
import type { DeskMood, VisualStyle } from "@/domain/recommendations";
import type { LocationId } from "@/game/world/locations";
import { getRememberedEmail } from "./identity";

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
  if (!email) return;
  try {
    const eventId = crypto.randomUUID();
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, eventId, email, properties }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    return;
  }
}

export function trackEventOnce<E extends keyof TrackProperties>(
  key: string,
  event: E,
  properties: TrackProperties[E],
) {
  if (!getRememberedEmail()) return;
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
