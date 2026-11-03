import { afterEach, describe, expect, it, vi } from "vitest";
import { IntegrationError } from "./client";
import { chatWithCustomerAgent } from "./customerAgent";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function providerResponse(body: unknown, status = 201) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/vnd.api+json" } });
}

function configureAgent() {
  vi.stubEnv("KLAVIYO_CUSTOMER_AGENT_API_KEY", "fake-agent-key");
  vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "");
  vi.stubEnv("KLAVIYO_CUSTOMER_AGENT_MODE", "preview");
  vi.stubEnv("KLAVIYO_LIVE_ALLOWED_EMAILS", "traveler@example.com");
}

describe("Customer Agent adapter", () => {
  it("creates a web-chat conversation with allowlisted email and maps public events", async () => {
    configureAgent();
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(providerResponse({ data: { id: "conversation-1" } }))
      .mockResolvedValueOnce(providerResponse({ data: { attributes: { events: [
        { type: "message", role: "agent", content: "Welcome, traveler." },
        { type: "product", product: { product_id: "unknown-id", title: "eMbEr", url: "https://example.com/ember" } },
        { type: "unknown-event", secret: "ignored" },
        { type: "require-authentication" },
        { type: "handoff", mode: "hard" },
      ] } } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await chatWithCustomerAgent({
      email: "traveler@example.com",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result).toEqual({
      status: "live",
      conversationId: "conversation-1",
      open: false,
      followUp: true,
      replies: [
        { kind: "message", text: "Welcome, traveler." },
        { kind: "product", productId: "ember", title: "eMbEr", url: "/products/ember" },
        { kind: "auth-required" },
        { kind: "handoff" },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [conversationUrl, conversationInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(conversationUrl).toBe("https://a.klaviyo.com/api/customer-agent-conversations");
    expect(new Headers(conversationInit.headers).get("revision")).toBe("2026-10-15.pre");
    expect(JSON.parse(String(conversationInit.body))).toEqual({
      data: {
        type: "customer-agent-conversation",
        attributes: { mode: "preview", channel: "web-chat", customer: { email: "traveler@example.com" } },
      },
    });
    const [, responseInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(responseInit.body))).toMatchObject({
      data: {
        type: "customer-agent-response",
        attributes: { mode: "preview", channel: "web-chat", messages: [{ role: "user", content: "Hello" }] },
        relationships: { conversation: { data: { type: "customer-agent-conversation", id: "conversation-1" } } },
      },
    });
  });

  it("does not attach a non-allowlisted email", async () => {
    configureAgent();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(providerResponse({ data: { id: "conversation-2" } }))
      .mockResolvedValueOnce(providerResponse({ data: { attributes: { events: [] } } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await chatWithCustomerAgent({
      email: "other@example.com",
      messages: [{ role: "user", content: "Hello" }],
    });
    const createBody = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(createBody.data.attributes).toEqual({ mode: "preview", channel: "web-chat" });
    expect(result).not.toHaveProperty("followUp");
  });

  it("fails with 503 when no API key is configured", async () => {
    vi.stubEnv("KLAVIYO_CUSTOMER_AGENT_API_KEY", "");
    vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "");
    await expect(chatWithCustomerAgent({ messages: [{ role: "user", content: "Hi" }] }))
      .rejects.toMatchObject<Partial<IntegrationError>>({ status: 503, code: "missing_configuration" });
  });

  it("maps provider rate limits without retrying the response request", async () => {
    configureAgent();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(providerResponse({ data: { id: "conversation-3" } }))
      .mockResolvedValueOnce(new Response("", { status: 429, headers: { "retry-after": "4" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(chatWithCustomerAgent({ messages: [{ role: "user", content: "Hi" }] }))
      .rejects.toMatchObject<Partial<IntegrationError>>({ status: 429, retryAfter: 4 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
