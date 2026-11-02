import { jsonRoute } from "@/server/http";
import { identifySchema } from "@/server/validation/integrations";
import { identifyProfile } from "@/server/klaviyo/profiles";

export const runtime = "nodejs";
export const POST = jsonRoute(identifySchema, identifyProfile);
