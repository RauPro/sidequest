import { jsonRoute } from "@/server/http";
import { subscribeSchema } from "@/server/validation/integrations";
import { subscribeProfile } from "@/server/klaviyo/subscriptions";

export const runtime = "nodejs";
export const POST = jsonRoute(subscribeSchema, subscribeProfile);

// Public configuration only; private credentials never cross this boundary.
export async function GET() {
  try {
    const { getIntegrationMode } = await import("@/server/env");
    return Response.json({ mode: getIntegrationMode() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "invalid_configuration" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
