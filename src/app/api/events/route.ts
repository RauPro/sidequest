import { guards, jsonRoute } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { eventSchema } from "@/server/validation/integrations";
import { recordEvent } from "@/server/klaviyo/events";

export const runtime = "nodejs";
export const POST = jsonRoute(eventSchema, recordEvent, guards(rateLimit("/api/events", 60, 60_000)));
