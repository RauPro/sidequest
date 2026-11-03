import "server-only";
import { checkBotId } from "botid/server";
import { IntegrationError } from "./client";

export async function guardCampChat() {
  if (process.env.SIDEQUEST_MODE === "demo" || process.env.CAMP_CHAT_MODE !== "live") return;

  if (process.env.VERCEL !== "1") {
    throw new IntegrationError(503, "protection_unavailable", "Camp chat is temporarily unavailable.");
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
