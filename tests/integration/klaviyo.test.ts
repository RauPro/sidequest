import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { identifyProfile } from "@/server/klaviyo/profiles";
import { recordEvent } from "@/server/klaviyo/events";
import { subscribeProfile } from "@/server/klaviyo/subscriptions";
import { GET as subscribeConfig, POST as subscribeRoute } from "@/app/api/subscribe/route";

const email = "sidequest-test@example.com";
const event = { email, event: "Sidequest Product Viewed" as const, eventId: "0305ce7f-9963-4ab8-9bf9-d702c0ac76fd", properties: { productId: "ember" as const, discoverySource: "shop" as const } };
const profile = () => Response.json({ data: { type: "profile", id: "profile-test" } }, { status: 200 });
const mockFetch = vi.fn<typeof fetch>();
const body = (index: number) => JSON.parse(String(mockFetch.mock.calls[index][1]?.body));

beforeEach(() => {
  vi.stubEnv("SIDEQUEST_MODE", "live");
  vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "fake-test-key");
  vi.stubEnv("KLAVIYO_LIST_ID", "test-list");
  vi.stubEnv("KLAVIYO_API_REVISION", "2026-10-15");
  vi.stubEnv("KLAVIYO_LIVE_ALLOWED_EMAILS", email);
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("live Klaviyo adapters with mocked transport", () => {
  it("exposes only public mode configuration", async () => {
    const response = await subscribeConfig();
    expect(await response.json()).toEqual({ mode: "live" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mockFetch).not.toHaveBeenCalled();
  });
  it("maps preferences inside profile attributes without claiming consent", async () => {
    mockFetch.mockResolvedValueOnce(profile());
    const result = await identifyProfile({ email, preferences: { preferredCompanion: "ember", deskMood: "bold", visualStyle: "fantasy" } });
    expect(result).toMatchObject({ status: "identified", profileId: "profile-test" });
    expect(body(0)).toEqual({ data: { type: "profile", attributes: { email, properties: { preferred_companion: "ember", desk_mood: "bold", visual_style: "fantasy" } } } });
    expect(mockFetch.mock.calls[0][0]).toBe("https://a.klaviyo.com/api/profile-import");
    expect(mockFetch.mock.calls[0][1]?.headers).toMatchObject({ revision: "2026-10-15", Authorization: "Klaviyo-API-Key fake-test-key" });
  });
  it("saves preferences before submitting subscription and reports acceptance only", async () => {
    mockFetch.mockResolvedValueOnce(profile()).mockResolvedValueOnce(new Response(null, { status: 202 }));
    const response = await subscribeRoute(new Request("http://localhost/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, consent: true, preferences: { preferredCompanion: "ember" } }) }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "accepted", mode: "live", operation: "subscribe", subscription: "pending" });
    expect(body(0).data.attributes.properties).toEqual({ preferred_companion: "ember" });
    expect(body(1)).toMatchObject({ data: { type: "profile-subscription-bulk-create-job", attributes: { historical_import: false, profiles: { data: [{ type: "profile", attributes: { email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }] } }, relationships: { list: { data: { type: "list", id: "test-list" } } } } });
  });
  it("does not request subscription if profile persistence fails", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 400 }));
    await expect(subscribeProfile({ email, consent: true })).rejects.toMatchObject({ code: "provider_rejected_request" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
  it("retries an event with the identical unique_id and payload", async () => {
    vi.useFakeTimers();
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(new Response(null, { status: 202 }));
    const pending = recordEvent(event);
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ status: "accepted", eventId: event.eventId, processing: "pending" });
    expect(body(0)).toEqual(body(1));
    expect(body(0).data.attributes.unique_id).toBe(event.eventId);
  });
  it("keeps demo checkout totals out of revenue fields", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 202 }));
    await recordEvent({ ...event, event: "Sidequest Demo Checkout Completed", properties: { productIds: ["ember"], quantities: [1], demoTotalMinor: 2400, currency: "USD", demoOrderId: event.eventId } });
    expect(body(0).data.attributes.properties).toMatchObject({ demoTotalMinor: 2400, is_demo: true });
    expect(body(0).data.attributes).not.toHaveProperty("value");
    expect(body(0).data.attributes).not.toHaveProperty("value_currency");
  });
  it("honors rate-limit delay rather than retrying immediately", async () => {
    vi.useFakeTimers();
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 429, headers: { "retry-after": "2" } })).mockResolvedValueOnce(new Response(null, { status: 202 }));
    const pending = recordEvent(event);
    await vi.advanceTimersByTimeAsync(1999);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
  it("returns a long Retry-After without exceeding the request budget", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 429, headers: { "retry-after": "60" } }));
    await expect(recordEvent(event)).rejects.toMatchObject({ status: 429, retryAfter: 60 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
  it("does not blindly replay a subscription after a timeout", async () => {
    mockFetch.mockResolvedValueOnce(profile()).mockRejectedValueOnce(new Error("network timeout"));
    await expect(subscribeProfile({ email, consent: true })).rejects.toMatchObject({ code: "provider_outcome_unknown" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
  it.each([401, 403])("does not retry credentials/scope failure %s", async status => {
    mockFetch.mockResolvedValueOnce(new Response("private provider detail", { status }));
    await expect(recordEvent(event)).rejects.toMatchObject({ code: "provider_credentials_rejected" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
  it("validates the provider response before declaring an identified profile", async () => {
    mockFetch.mockResolvedValueOnce(Response.json({ data: { type: "profile" } }));
    await expect(identifyProfile({ email })).rejects.toMatchObject({ code: "invalid_provider_response" });
  });
  it("blocks non-allowlisted recipients before any external request", async () => {
    await expect(identifyProfile({ email: "someone-else@example.com" })).rejects.toMatchObject({ code: "recipient_not_allowed" });
    expect(mockFetch).not.toHaveBeenCalled();
  });
  it("requires explicit consent before calling the provider", async () => {
    await expect(subscribeProfile({ email, consent: false } as never)).rejects.toThrow();
    expect(mockFetch).not.toHaveBeenCalled();
  });
  it("retains the no-network demo behavior", async () => {
    vi.stubEnv("SIDEQUEST_MODE", "demo");
    expect(await subscribeProfile({ email, consent: true })).toMatchObject({ status: "simulated", delivered: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
