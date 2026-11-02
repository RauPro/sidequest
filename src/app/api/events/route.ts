import { jsonRoute } from "@/server/http";
import { eventSchema } from "@/server/validation/integrations";
import { recordEvent } from "@/server/klaviyo/events";

export const runtime = "nodejs";
export const POST = jsonRoute(eventSchema, recordEvent);
