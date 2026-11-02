import "server-only";
import { z } from "zod";

export function getIntegrationMode() {
  return z.enum(["demo", "live"]).parse(process.env.SIDEQUEST_MODE ?? "demo");
}

export function getSubscriptionAccess() {
  return z.enum(["invited", "public"]).parse(process.env.KLAVIYO_SUBSCRIPTION_ACCESS ?? "invited");
}

export function getKlaviyoConfig() {
  return z.object({
    privateKey: z.string().trim().min(1),
    listId: z.string().trim().min(1),
    revision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse({
    privateKey: process.env.KLAVIYO_PRIVATE_API_KEY,
    listId: process.env.KLAVIYO_LIST_ID,
    revision: process.env.KLAVIYO_API_REVISION,
  });
}
