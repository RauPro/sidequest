import type { Cart } from "@/domain/cart";
import { buildAddedToCart, buildStartedCheckout, buildViewedProduct } from "@/domain/klaviyoMetrics";
import type { ProductId } from "@/domain/catalog";
import type { DemoOrder } from "@/domain/orders";
import type { DeskMood, VisualStyle } from "@/domain/recommendations";
import type { LocationId } from "@/game/world/locations";
import type { LetterId } from "@/domain/letters";
import { sendClientEvent } from "./clientApi";

export type TrackProperties = {
  "Sidequest Location Visited": { location: LocationId };
  "Sidequest Product Viewed": { productId: ProductId; discoverySource: "market" | "oracle" | "shop" | "camp" };
  "Sidequest Oracle Completed": { recommendedProductId: ProductId; ruleVersion: "2"; deskMood: DeskMood; visualStyle: VisualStyle };
  "Sidequest Camp Question Asked": { topic: "companion" | "checkout" | "shipping" | "custom" };
  "Sidequest Letter Opened": { letter: LetterId };
  "Sidequest Demo Checkout Completed": { productIds: ProductId[]; quantities: number[]; demoTotalMinor: number; currency: "USD"; demoOrderId: string };
};

const tracked = new Set<string>();
const trackedKey = "sidequest:events:v1";

function origin(): string {
  return typeof window === "undefined" ? "https://sidequest.raul.engineer" : window.location.origin;
}

function createEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function trackEvent<E extends keyof TrackProperties>(event: E, properties: TrackProperties[E]) {
  const uniqueId = createEventId();
  if (event === "Sidequest Product Viewed") {
    const viewed = properties as TrackProperties["Sidequest Product Viewed"];
    return sendClientEvent({ ...buildViewedProduct(viewed.productId, viewed.discoverySource, origin()), uniqueId });
  }
  const eventProperties = properties as Record<string, unknown>;
  return sendClientEvent({
    metric: event,
    properties: event === "Sidequest Demo Checkout Completed"
      ? { ...eventProperties, is_demo: true }
      : eventProperties,
    uniqueId,
  });
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

export function trackAddedToCart(previousCart: Cart, cart: Cart, productId: ProductId) {
  const metric = buildAddedToCart(previousCart, cart, productId, origin());
  if (!metric) return null;
  return sendClientEvent({ ...metric, uniqueId: createEventId() });
}

export function trackStartedCheckout(cart: Cart, checkoutId: string) {
  const metric = buildStartedCheckout(cart, checkoutId, origin());
  return sendClientEvent({ ...metric, uniqueId: checkoutId });
}

export function trackDemoCheckout(order: DemoOrder) {
  return trackEvent("Sidequest Demo Checkout Completed", {
    productIds: order.lines.map((line) => line.productId),
    quantities: order.lines.map((line) => line.quantity),
    demoTotalMinor: order.totalMinor,
    currency: order.currency,
    demoOrderId: order.id,
  });
}
