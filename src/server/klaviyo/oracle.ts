import "server-only";
import { z } from "zod";
import { moods, recommend } from "@/domain/recommendations";
import { IntegrationError } from "./client";

export const oraclePreferencesSchema = z.object({
  email: z.string().trim().email().max(254),
  mood: z.enum(moods),
}).strict();

export async function saveOraclePreferences(input: z.infer<typeof oraclePreferencesSchema>) {
  const { email, mood } = oraclePreferencesSchema.parse(input);
  const mode = process.env.ORACLE_PROFILE_MODE ?? "demo";
  if (mode === "demo") return { status: "simulated", saved: false };
  if (mode !== "live") throw new IntegrationError(503, "invalid_configuration", "Preference saving is unavailable.");
  // This demo has no account sign-in yet. Keep profile writes limited to invited testers.
  const allowed = (process.env.ORACLE_PROFILE_ALLOWED_EMAILS ?? "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(email.toLowerCase())) throw new IntegrationError(403, "tester_not_enabled", "Profile saving is currently available to invited demo testers. You can still explore your recommendation.");
  const key = process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!key) throw new IntegrationError(503, "missing_configuration", "Preference saving is unavailable.");
  const properties = {
    preferred_companion: recommend(mood).productId,
    desk_mood: mood,
    visual_style: { bold: "fantasy", calm: "nature", curious: "technology" }[mood],
  };
  let response: Response;
  try {
    response = await fetch("https://a.klaviyo.com/api/profile-import", {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Klaviyo-API-Key ${key}`, revision: "2026-10-15", accept: "application/vnd.api+json", "content-type": "application/vnd.api+json" },
      body: JSON.stringify({ data: { type: "profile", attributes: { email, properties } } }),
    });
  } catch {
    throw new IntegrationError(503, "save_unconfirmed", "We could not confirm the save. You can retry the same choice.");
  }
  if (response.status !== 200 && response.status !== 201) {
    await response.body?.cancel();
    throw new IntegrationError(response.status === 429 ? 429 : 503, "save_unconfirmed", "We could not confirm the save. Please try again later.");
  }
  try {
    const profile = z.object({ data: z.object({ type: z.literal("profile"), id: z.string().min(1), attributes: z.object({ properties: z.object({ preferred_companion: z.literal(properties.preferred_companion), desk_mood: z.literal(mood), visual_style: z.literal(properties.visual_style) }) }) }) });
    profile.parse(await response.json());
  } catch {
    throw new IntegrationError(502, "save_unconfirmed", "The saved preference could not be verified. You can retry the same choice.");
  }
  // No subscriptions, lists, events, emails, or customer data are returned to the browser.
  return { status: "saved", saved: true, companion: properties.preferred_companion };
}
