import { jsonRoute } from "@/server/http";
import { oraclePreferencesSchema, saveOraclePreferences } from "@/server/klaviyo/oracle";

export const runtime = "nodejs";
export const POST = jsonRoute(oraclePreferencesSchema, saveOraclePreferences);
