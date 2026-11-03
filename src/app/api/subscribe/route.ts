import { guards, jsonRoute } from "@/server/http";
import { subscribeSchema } from "@/server/validation/integrations";
import { subscribeProfile } from "@/server/klaviyo/subscriptions";
import { guardSubscription } from "@/server/klaviyo/subscription-guard";
import { getIntegrationMode, getSubscriptionAccess } from "@/server/env";
import { verifyNewsletterList } from "@/server/klaviyo/newsletter-list";
import { rateLimit } from "@/server/rateLimit";

export const runtime = "nodejs";
export const POST = jsonRoute(subscribeSchema, subscribeProfile, guards(rateLimit("/api/subscribe", 6, 60_000), guardSubscription));

// Public configuration only; private credentials never cross this boundary.
export async function GET() {
  try {
    const mode = getIntegrationMode();
    const isPublic = mode === "live" && getSubscriptionAccess() === "public";
    // A read-only readiness check also prevents offering signup with broken credentials.
    if (isPublic) await verifyNewsletterList();
    return Response.json({ mode, ...(isPublic ? { confirmationRequired: true } : {}) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "invalid_configuration" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
