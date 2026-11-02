import "server-only";
import { subscribeSchema, type SubscribeInput } from "@/server/validation/integrations";
import { demoResult, klaviyoRequest, liveConfig } from "./client";
import { identifyProfile } from "./profiles";

export async function subscribeProfile(input: SubscribeInput) {
  const parsed = subscribeSchema.parse(input);
  const demo = demoResult("subscribe");
  if (demo) return demo;
  const config = liveConfig(parsed.email);
  // Await preference persistence before the subscription can trigger a welcome flow.
  await identifyProfile({ email: parsed.email, preferences: parsed.preferences });
  await klaviyoRequest({ path: "/api/profile-subscription-bulk-create-jobs", email: parsed.email, replaySafe: false, expected: [202], body: {
    data: {
      type: "profile-subscription-bulk-create-job",
      attributes: { historical_import: false, profiles: { data: [{ type: "profile", attributes: { email: parsed.email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }] } },
      relationships: { list: { data: { type: "list", id: config.listId } } },
    },
  } });
  return { status: "accepted" as const, mode: "live" as const, operation: "subscribe" as const, subscription: "pending" as const };
}
