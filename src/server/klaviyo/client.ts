import "server-only";
import { getIntegrationMode, getKlaviyoConfig } from "@/server/env";
import type { DemoIntegrationResult, IntegrationOperation } from "@/domain/events";

export class IntegrationError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly retryAfter?: number) { super(message); }
}

export function demoResult(operation: IntegrationOperation): DemoIntegrationResult | null {
  let mode;
  try { mode = getIntegrationMode(); } catch {
    throw new IntegrationError(503, "invalid_configuration", "The integration mode is not configured correctly.");
  }
  return mode === "demo" ? { status: "simulated", mode, operation, delivered: false } : null;
}

export function liveConfig(email: string) {
  let config;
  try { config = getKlaviyoConfig(); } catch {
    throw new IntegrationError(503, "missing_configuration", "The live integration is not configured.");
  }
  // Development gate: live delivery is limited to deliberately configured test recipients.
  const allowed = (process.env.KLAVIYO_LIVE_ALLOWED_EMAILS ?? "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(email.trim().toLowerCase())) {
    throw new IntegrationError(403, "recipient_not_allowed", "This recipient is not enabled for live integration testing.");
  }
  return config;
}

type RequestOptions = { path: "/api/profile-import" | "/api/events" | "/api/profile-subscription-bulk-create-jobs"; body: unknown; email: string; replaySafe: boolean; expected: readonly number[] };
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function klaviyoRequest({ path, body, email, replaySafe, expected }: RequestOptions): Promise<Response> {
  const config = liveConfig(email);
  const encoded = JSON.stringify(body); // Reuse the exact body and event identity on retries.
  const deadline = Date.now() + 15_000;
  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response;
    try {
      response = await fetch(`https://a.klaviyo.com${path}`, {
        method: "POST", cache: "no-store", redirect: "error",
        headers: { Authorization: `Klaviyo-API-Key ${config.privateKey}`, revision: config.revision, accept: "application/vnd.api+json", "content-type": "application/vnd.api+json" },
        body: encoded, signal: AbortSignal.timeout(Math.max(1, Math.min(5000, deadline - Date.now()))),
      });
    } catch {
      if (!replaySafe) throw new IntegrationError(503, "provider_outcome_unknown", "The subscription result is unknown. Check its status before trying again.");
      if (attempt === 2 || Date.now() >= deadline) throw new IntegrationError(503, "provider_unavailable", "The service could not confirm this operation. Retry with the same operation ID.");
      await sleep(250 * 2 ** attempt + Math.floor(Math.random() * 100));
      continue;
    }
    if (expected.includes(response.status)) return response;
    const status = response.status;
    const rawRetryAfter = response.headers.get("retry-after");
    await response.body?.cancel(); // Never return/log provider bodies containing personal data.
    if (status === 429 || (status >= 500 && replaySafe)) {
      const seconds = rawRetryAfter === null ? NaN : Number(rawRetryAfter);
      const delay = status === 429 && Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 250 * 2 ** attempt + Math.floor(Math.random() * 100);
      if (attempt < 2 && Date.now() + delay + 1000 < deadline) { await sleep(delay); continue; }
      throw new IntegrationError(status === 429 ? 429 : 503, status === 429 ? "provider_rate_limited" : "provider_unavailable", "The service is temporarily unavailable. Please try again later.", status === 429 ? Math.max(1, Math.ceil(delay / 1000)) : undefined);
    }
    if (status >= 500 && !replaySafe) throw new IntegrationError(503, "provider_outcome_unknown", "The subscription result is unknown. Check its status before trying again.");
    if (status === 401 || status === 403) throw new IntegrationError(503, "provider_credentials_rejected", "The integration credentials or permissions need attention.");
    throw new IntegrationError(502, "provider_rejected_request", "The provider did not accept this operation.");
  }
  throw new IntegrationError(503, "provider_unavailable", "The operation could not be confirmed.");
}
