import "server-only";
import { getIntegrationMode, getKlaviyoConfig } from "@/server/env";
import type { DemoIntegrationResult, IntegrationOperation } from "@/domain/events";

export class IntegrationError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

// Explicit scaffold adapter. No external requests are made by this foundation.
export async function runIntegration(operation: IntegrationOperation): Promise<DemoIntegrationResult> {
  let mode;
  try { mode = getIntegrationMode(); } catch {
    throw new IntegrationError(503, "invalid_configuration", "The integration mode is not configured correctly.");
  }
  if (mode === "demo") return { status: "simulated", mode, operation, delivered: false };
  try { getKlaviyoConfig(); } catch {
    throw new IntegrationError(503, "missing_configuration", "The live integration is not configured.");
  }
  throw new IntegrationError(501, "live_adapter_pending", "Live Klaviyo delivery has not been implemented in this scaffold.");
}
