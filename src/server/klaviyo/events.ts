import "server-only";
import { eventSchema, type EventInput } from "@/server/validation/integrations";
import { demoResult, klaviyoRequest } from "./client";

export async function recordEvent(input: EventInput) {
  const parsed = eventSchema.parse(input);
  const demo = demoResult("event");
  if (demo) return demo;
  await klaviyoRequest({ path: "/api/events", email: parsed.email, replaySafe: true, expected: [202], body: {
    data: { type: "event", attributes: {
      unique_id: parsed.eventId,
      metric: { data: { type: "metric", attributes: { name: parsed.event } } },
      profile: { data: { type: "profile", attributes: { email: parsed.email } } },
      properties: { ...parsed.properties, ...(parsed.event === "Sidequest Demo Checkout Completed" ? { is_demo: true } : {}) },
      // Demo totals stay custom properties; never populate monetary value/value_currency.
    } },
  } });
  return { status: "accepted" as const, mode: "live" as const, operation: "event" as const, eventId: parsed.eventId, processing: "pending" as const };
}
