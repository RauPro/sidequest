import "server-only";
import { z } from "zod";
import { identifySchema, type IdentifyInput } from "@/server/validation/integrations";
import { demoResult, IntegrationError, klaviyoRequest } from "./client";

export function profileProperties(preferences: IdentifyInput["preferences"]) {
  return Object.fromEntries(Object.entries({ preferred_companion: preferences?.preferredCompanion, desk_mood: preferences?.deskMood, visual_style: preferences?.visualStyle }).filter(([, value]) => value !== undefined));
}

export async function identifyProfile(input: IdentifyInput) {
  const parsed = identifySchema.parse(input);
  const demo = demoResult("identify");
  if (demo) return demo;
  const response = await klaviyoRequest({ path: "/api/profile-import", email: parsed.email, replaySafe: true, expected: [200, 201], body: {
    data: { type: "profile", attributes: { email: parsed.email, ...(parsed.preferences ? { properties: profileProperties(parsed.preferences) } : {}) } },
  } });
  try {
    const profile = z.object({ data: z.object({ type: z.literal("profile"), id: z.string().min(1) }) }).parse(await response.json());
    return { status: "identified" as const, mode: "live" as const, operation: "identify" as const, profileId: profile.data.id };
  } catch {
    throw new IntegrationError(502, "invalid_provider_response", "The profile response could not be verified.");
  }
}
