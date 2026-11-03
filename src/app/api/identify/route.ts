import { guards, jsonRoute } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { identifySchema } from "@/server/validation/integrations";
import { identifyProfile } from "@/server/klaviyo/profiles";

export const runtime = "nodejs";
export const POST = jsonRoute(identifySchema, identifyProfile, guards(rateLimit("/api/identify", 12, 60_000)));
