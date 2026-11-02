import "server-only";
import { getSubscriptionAccess } from "@/server/env";
import { subscribeSchema, type SubscribeInput } from "@/server/validation/integrations";
import { demoResult, IntegrationError, klaviyoRequest, liveConfig } from "./client";
import { identifyProfile } from "./profiles";
import { verifyNewsletterList } from "./newsletter-list";

export async function subscribeProfile(input: SubscribeInput) {
  const parsed = subscribeSchema.parse(input);
  const demo = demoResult("subscribe");
  if (demo) return demo;
  const isPublic = getSubscriptionAccess() === "public";
  const config = liveConfig(parsed.email, true);
  if (isPublic) {
    // An email typed into a public signup form is not proof of profile ownership.
    if (parsed.preferences) throw new IntegrationError(400, "preferences_not_allowed", "Save preferences through the verified profile flow.");
    // Check the provider's actual list setting, not an environment assertion.
    // Skip profile-import: Klaviyo creates new profiles after double opt-in confirmation.
    await verifyNewsletterList(config);
  } else {
    // Invited tests may explicitly save preferences before subscribing.
    await identifyProfile({ email: parsed.email, preferences: parsed.preferences });
  }
  await klaviyoRequest({ path: "/api/profile-subscription-bulk-create-jobs", email: parsed.email, replaySafe: false, expected: [202], body: {
    data: {
      type: "profile-subscription-bulk-create-job",
      attributes: { historical_import: false, profiles: { data: [{ type: "profile", attributes: { email: parsed.email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }] } },
      relationships: { list: { data: { type: "list", id: config.listId } } },
    },
  } });
  return { status: "accepted" as const, mode: "live" as const, operation: "subscribe" as const, subscription: "pending" as const, ...(isPublic ? { confirmationRequired: true } : {}) };
}
