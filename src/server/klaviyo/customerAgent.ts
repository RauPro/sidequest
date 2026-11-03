import "server-only";
import { z } from "zod";
import { getProduct, isProductId, type ProductId } from "@/domain/catalog";
import type { CampReply } from "@/domain/campGuide";
import { IntegrationError } from "./client";

const revision = "2026-10-15.pre";
const resourceConversation = "customer-agent-conversation";

export type CustomerAgentMessage = { role: "user" | "agent"; content: string };

export type CustomerAgentInput = {
  conversationId?: string;
  messages: CustomerAgentMessage[];
  email?: string;
};

function integrationMode(): "preview" | "live" {
  const value = process.env.KLAVIYO_CUSTOMER_AGENT_MODE ?? "preview";
  if (value !== "preview" && value !== "live") {
    throw new IntegrationError(503, "invalid_configuration", "Customer Agent mode is unavailable.");
  }
  return value;
}

function allowedEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  const allowlist = (process.env.KLAVIYO_LIVE_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase()) ? email : undefined;
}

function providerHeaders(key: string) {
  return {
    Authorization: `Klaviyo-API-Key ${key}`,
    revision,
    accept: "application/vnd.api+json",
    "content-type": "application/vnd.api+json",
  };
}

async function post(path: string, key: string, body: unknown): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`https://a.klaviyo.com${path}`, {
      method: "POST",
      cache: "no-store",
      redirect: "error",
      headers: providerHeaders(key),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new IntegrationError(503, "customer_agent_unavailable", "Finn could not reach the guide right now. Please try again.");
  }
  if (response.status === 429) {
    const rawRetry = response.headers.get("retry-after");
    await response.body?.cancel();
    const retryAfter = rawRetry && /^\d+$/.test(rawRetry) ? Number(rawRetry) : 30;
    throw new IntegrationError(429, "provider_rate_limited", "Finn is busy with other travelers. Please try again shortly.", retryAfter);
  }
  if (!response.ok) {
    const status = response.status;
    await response.body?.cancel();
    throw new IntegrationError(status === 401 || status === 403 ? 503 : 502, "customer_agent_rejected", "Finn could not answer right now. Please try again.");
  }
  return response;
}

function getProductId(productId: unknown, title: unknown): ProductId | undefined {
  if (typeof productId === "string" && isProductId(productId)) return productId;
  if (typeof title !== "string") return undefined;
  return (["ember", "moss", "bolt"] as const).find((id) => {
    const product = getProduct(id);
    return title.trim().toLowerCase() === id || title.trim().toLowerCase() === product.name.toLowerCase();
  });
}

function mapEvents(events: unknown[]): { replies: CampReply[]; open: boolean } {
  const replies: CampReply[] = [];
  let open = true;
  for (const rawEvent of events) {
    if (!rawEvent || typeof rawEvent !== "object") continue;
    const event = rawEvent as Record<string, unknown>;
    if (event.type === "message" && event.role === "agent" && typeof event.content === "string") {
      replies.push({ kind: "message", text: event.content });
    } else if (event.type === "product" && event.product && typeof event.product === "object") {
      const product = event.product as Record<string, unknown>;
      if (typeof product.title !== "string") continue;
      const productId = getProductId(product.product_id, product.title);
      replies.push({
        kind: "product",
        ...(productId ? { productId, url: `/products/${productId}` } : {}),
        title: product.title,
      });
    } else if (event.type === "handoff") {
      replies.push({ kind: "handoff" });
      open = false;
    } else if (event.type === "require-authentication") {
      replies.push({ kind: "auth-required" });
    } else if (event.type === "error") {
      throw new IntegrationError(502, "customer_agent_error", "Finn could not answer right now. Please try again.");
    }
  }
  return { replies, open };
}

export async function chatWithCustomerAgent(input: CustomerAgentInput) {
  const mode = integrationMode();
  const key = process.env.KLAVIYO_CUSTOMER_AGENT_API_KEY ?? process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!key) throw new IntegrationError(503, "missing_configuration", "Customer Agent is not configured.");

  let conversationId = input.conversationId;
  let followUp = false;
  if (!conversationId) {
    const customerEmail = allowedEmail(input.email);
    followUp = Boolean(customerEmail);
    const response = await post("/api/customer-agent-conversations", key, {
      data: {
        type: resourceConversation,
        attributes: {
          mode,
          channel: "web-chat",
          ...(customerEmail ? { customer: { email: customerEmail } } : {}),
        },
      },
    });
    let conversation: unknown;
    try {
      conversation = await response.json();
    } catch {
      throw new IntegrationError(502, "invalid_customer_agent_response", "Finn could not start a chat right now.");
    }
    const parsed = z.object({ data: z.object({ id: z.string().min(1) }) }).safeParse(conversation);
    if (!parsed.success) throw new IntegrationError(502, "invalid_customer_agent_response", "Finn could not start a chat right now.");
    conversationId = parsed.data.data.id;
  }

  const response = await post("/api/customer-agent-responses", key, {
    data: {
      type: "customer-agent-response",
      attributes: { mode, channel: "web-chat", messages: input.messages },
      relationships: { conversation: { data: { type: resourceConversation, id: conversationId } } },
    },
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new IntegrationError(502, "invalid_customer_agent_response", "Finn could not answer right now. Please try again.");
  }
  const parsed = z.object({
    data: z.object({ attributes: z.object({ events: z.array(z.unknown()) }) }),
  }).safeParse(body);
  if (!parsed.success) throw new IntegrationError(502, "invalid_customer_agent_response", "Finn could not answer right now. Please try again.");
  const mapped = mapEvents(parsed.data.data.attributes.events);
  return { status: "live" as const, conversationId, ...mapped, ...(followUp ? { followUp: true } : {}) };
}
