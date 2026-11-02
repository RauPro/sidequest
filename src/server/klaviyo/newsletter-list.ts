import "server-only";
import { z } from "zod";
import { getKlaviyoConfig } from "@/server/env";
import { IntegrationError } from "./client";

export async function verifyNewsletterList(config = getKlaviyoConfig()) {
  let response: Response;
  try {
    response = await fetch(`https://a.klaviyo.com/api/lists/${encodeURIComponent(config.listId)}`, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Klaviyo-API-Key ${config.privateKey}`, revision: config.revision, accept: "application/vnd.api+json" },
    });
  } catch {
    throw new IntegrationError(503, "confirmation_unavailable", "Newsletter signup is temporarily unavailable.");
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new IntegrationError(503, "confirmation_unavailable", "Newsletter signup is temporarily unavailable.");
  }
  const list = z.object({ data: z.object({ type: z.literal("list"), id: z.literal(config.listId), attributes: z.object({ opt_in_process: z.literal("double_opt_in") }) }) });
  if (!list.safeParse(await response.json().catch(() => null)).success) {
    throw new IntegrationError(503, "confirmation_unavailable", "Newsletter signup is temporarily unavailable.");
  }
}
