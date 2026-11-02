import { jsonRoute } from "@/server/http";
import { subscribeSchema } from "@/server/validation/integrations";
import { subscribeProfile } from "@/server/klaviyo/subscriptions";

export const runtime = "nodejs";
export const POST = jsonRoute(subscribeSchema, subscribeProfile);
