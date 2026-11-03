"use client";

import { recordLedger, updateLedger } from "./ledger";
import { getKlaviyoIdentifiers, getRememberedEmail, maskEmail } from "./identity";

export type ClientEventInput = {
  metric: string;
  properties: Record<string, unknown>;
  value?: number;
  uniqueId: string;
};

export type ClientEventResult = {
  status: "simulated" | "sent" | "accepted" | "failed";
  detail: string;
};

type ClientEventBody = {
  data: {
    type: "event";
    attributes: {
      metric: { data: { type: "metric"; attributes: { name: string } } };
      profile: { data: { type: "profile"; attributes: ReturnType<typeof getKlaviyoIdentifiers> } };
      properties: Record<string, unknown>;
      unique_id: string;
      value?: number;
      value_currency?: "USD";
    };
  };
};

const revision = "2026-10-15";
const retryDelayMs = 500;

function propertyString(properties: Record<string, unknown>, key: string): string | null {
  const value = properties[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function formatDollars(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value) ? `$${value.toFixed(2)}` : null;
}

function eventSummary(input: ClientEventInput): string {
  const { properties } = input;
  if (input.metric === "Viewed Product" || input.metric === "Added to Cart") {
    const name = propertyString(
      properties,
      input.metric === "Viewed Product" ? "ProductName" : "AddedItemProductName",
    ) ?? propertyString(properties, input.metric === "Viewed Product" ? "ProductID" : "AddedItemProductID") ?? "product";
    const value = formatDollars(input.value ?? properties.$value ?? properties.Price);
    return value ? `${name} · ${value}` : name;
  }
  if (input.metric === "Started Checkout") {
    const itemNames = properties.ItemNames;
    const cart = Array.isArray(itemNames) ? itemNames.filter((name): name is string => typeof name === "string").join(", ") : "";
    const value = formatDollars(input.value ?? properties.$value);
    return [cart || "cart", value].filter(Boolean).join(" · ");
  }
  if (input.metric === "Sidequest Demo Checkout Completed" && typeof properties.demoTotalMinor === "number") {
    const value = formatDollars(properties.demoTotalMinor / 100);
    return value ? `demo total ${value}` : input.metric;
  }
  const keyByMetric: Record<string, string> = {
    "Sidequest Location Visited": "location",
    "Sidequest Letter Opened": "letter",
    "Sidequest Product Viewed": "productId",
    "Sidequest Oracle Completed": "recommendedProductId",
    "Sidequest Camp Question Asked": "topic",
  };
  const key = keyByMetric[input.metric];
  const value = key ? propertyString(properties, key) : null;
  return key && value ? `${key}: ${value}` : input.metric;
}

function getSiteId(): string | null {
  const siteId = process.env.NEXT_PUBLIC_KLAVIYO_SITE_ID?.trim();
  return siteId && /^[A-Za-z0-9_-]{6,64}$/.test(siteId) ? siteId : null;
}

export function buildClientEventBody(input: ClientEventInput): ClientEventBody {
  const attributes: ClientEventBody["data"]["attributes"] = {
    metric: { data: { type: "metric", attributes: { name: input.metric } } },
    profile: { data: { type: "profile", attributes: getKlaviyoIdentifiers() } },
    properties: input.properties,
    unique_id: input.uniqueId,
  };
  if (typeof input.value === "number" && Number.isFinite(input.value)) {
    attributes.value = input.value;
    attributes.value_currency = "USD";
  }
  return { data: { type: "event", attributes } };
}

function parseRetryAfter(response: Response): number | null {
  const value = response.headers.get("Retry-After")?.trim();
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, (date - Date.now()) / 1000) : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendClientEvent(input: ClientEventInput): Promise<ClientEventResult> {
  const email = getRememberedEmail();
  const recipient = email ? `Recipient ${maskEmail(email)}. ` : "";
  let ledgerId: string;
  try {
    ledgerId = recordLedger({
      channel: "client",
      operation: "event",
      label: input.metric,
      status: "sent",
      ...(email ? { detail: recipient.trim() } : {}),
    });
  } catch {
    return { status: "failed", detail: "The event could not be recorded." };
  }
  const finish = (status: ClientEventResult["status"], outcome: string): ClientEventResult => {
    const message = [
      `unique_id ${input.uniqueId.slice(0, 8)}…`,
      eventSummary(input),
      outcome,
      recipient.trim(),
    ].filter(Boolean).join(" · ");
    updateLedger(ledgerId, { status, detail: message });
    return { status, detail: message };
  };
  if (process.env.NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING !== "live") {
    return finish("simulated", "simulated, no request made");
  }
  const siteId = getSiteId();
  if (!siteId) return finish("simulated", "simulated, no request made (valid Klaviyo site ID is not configured)");
  let body: string;
  try {
    body = JSON.stringify(buildClientEventBody(input));
  } catch {
    return finish("failed", "request could not be prepared; no HTTP response");
  }

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(`https://a.klaviyo.com/client/events?company_id=${encodeURIComponent(siteId)}`, {
          method: "POST",
          headers: {
            revision,
            "content-type": "application/vnd.api+json",
            accept: "application/vnd.api+json",
          },
          body,
          keepalive: true,
        });
      } catch {
        if (attempt === 0) {
          await delay(retryDelayMs);
          continue;
        }
        return finish("failed", "request failed before an HTTP response");
      }

      if (response.status === 202) return finish("accepted", "HTTP 202 accepted");
      if (attempt === 0 && response.status >= 500) {
        await delay(retryDelayMs);
        continue;
      }
      if (attempt === 0 && response.status === 429) {
        const retryAfter = parseRetryAfter(response);
        if (retryAfter !== null && retryAfter <= 5) {
          await delay(retryAfter * 1000);
          continue;
        }
      }
      return finish("failed", `HTTP ${response.status} failed`);
    }
  } catch {
    return finish("failed", "request failed before an HTTP response");
  }
  return finish("failed", "request failed before an HTTP response");
}
