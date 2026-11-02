import "server-only";
import { checkBotId } from "botid/server";
import { getIntegrationMode, getSubscriptionAccess } from "@/server/env";
import { IntegrationError } from "./client";

export async function guardSubscription() {
  if (getIntegrationMode() === "demo" || getSubscriptionAccess() === "invited") return;
  // BotID is enforced by Vercel. Never mistake its local development bypass for protection.
  if (process.env.VERCEL !== "1") {
    throw new IntegrationError(503, "protection_unavailable", "Newsletter signup is temporarily unavailable.");
  }
  let verification;
  try {
    verification = await checkBotId({ advancedOptions: { checkLevel: "basic" } });
  } catch {
    throw new IntegrationError(503, "protection_unavailable", "We could not verify this request. Please try again later.");
  }
  if (verification.isBot) {
    throw new IntegrationError(403, "request_not_verified", "We could not verify this request. Refresh the page and try again.");
  }
}
