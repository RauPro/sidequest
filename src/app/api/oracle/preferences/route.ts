import { guards, jsonRoute } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { oraclePreferencesSchema, saveOraclePreferences } from "@/server/klaviyo/oracle";

export const runtime = "nodejs";
export const POST = jsonRoute(oraclePreferencesSchema, saveOraclePreferences, guards(rateLimit("/api/oracle/preferences", 6, 60_000)));
