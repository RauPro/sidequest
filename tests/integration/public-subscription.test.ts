import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, GET } from "@/app/api/subscribe/route";
import { identifyProfile } from "@/server/klaviyo/profiles";
import { recordEvent } from "@/server/klaviyo/events";

const { checkBotId } = vi.hoisted(() => ({ checkBotId: vi.fn() }));
vi.mock("botid/server", () => ({ checkBotId }));
const fetchMock = vi.fn<typeof fetch>();
const email = "new-visitor@example.com";
const list = (optIn = "double_opt_in") => Response.json({ data: { type: "list", id: "test-list", attributes: { opt_in_process: optIn } } });
const request = (body: unknown = { email, consent: true }) => new Request("https://sidequest.example/api/subscribe", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: "https://sidequest.example" }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.stubEnv("SIDEQUEST_MODE", "live");
  vi.stubEnv("KLAVIYO_SUBSCRIPTION_ACCESS", "public");
  vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "fake-test-key");
  vi.stubEnv("KLAVIYO_LIST_ID", "test-list");
  vi.stubEnv("KLAVIYO_API_REVISION", "2026-10-15");
  vi.stubEnv("KLAVIYO_LIVE_ALLOWED_EMAILS", "");
  vi.stubEnv("VERCEL", "1");
  checkBotId.mockReset().mockResolvedValue({ isBot: false });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("public newsletter signup", () => {
  it("accepts a new visitor only after bot and double-opt-in checks, without profile overwrites", async () => {
    fetchMock.mockResolvedValueOnce(list()).mockResolvedValueOnce(new Response(null, { status: 202 }));
    const response = await POST(request());
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ status: "accepted", subscription: "pending", confirmationRequired: true });
    expect(checkBotId).toHaveBeenCalledWith({ advancedOptions: { checkLevel: "basic" } });
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      "https://a.klaviyo.com/api/lists/test-list", "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs",
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({ data: {
      attributes: { historical_import: false, profiles: { data: [{ attributes: { email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }] } },
      relationships: { list: { data: { id: "test-list" } } },
    } });
  });
  it("reports public confirmation without exposing configuration", async () => {
    fetchMock.mockResolvedValueOnce(list());
    expect(await (await GET()).json()).toEqual({ mode: "live", confirmationRequired: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not offer signup when production credentials cannot read the list", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("fake-test-key");
  });
  it.each(["single_opt_in", "unknown"])("fails closed when the list uses %s", async setting => {
    fetchMock.mockResolvedValueOnce(list(setting));
    expect((await POST(request())).status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([Response.json({ data: {} }), new Response(null, { status: 403 })])("fails closed when list verification fails", async response => {
    fetchMock.mockResolvedValueOnce(response);
    expect((await POST(request())).status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not subscribe when list verification times out", async () => {
    fetchMock.mockRejectedValueOnce(new Error("timeout"));
    expect((await POST(request())).status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("blocks automated requests before contacting Klaviyo", async () => {
    checkBotId.mockResolvedValueOnce({ isBot: true });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "request_not_verified" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("fails closed when bot protection is unavailable", async () => {
    checkBotId.mockRejectedValueOnce(new Error("provider detail"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("provider detail");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("cannot enable public live signup outside Vercel", async () => {
    vi.stubEnv("VERCEL", "");
    expect((await POST(request())).status).toBe(503);
    expect(checkBotId).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([{ email, consent: false }, { email, consent: true, preferences: { deskMood: "calm" } }])("rejects unconsented signup and unauthenticated preference updates", async body => {
    expect((await POST(request(body))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("does not expose profile and event writes by enabling public subscriptions", async () => {
    await expect(identifyProfile({ email })).rejects.toMatchObject({ code: "recipient_not_allowed" });
    await expect(recordEvent({ email, event: "Sidequest Product Viewed", eventId: "0305ce7f-9963-4ab8-9bf9-d702c0ac76fd", properties: {} })).rejects.toMatchObject({ code: "recipient_not_allowed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("retains demo isolation even with public access configured", async () => {
    vi.stubEnv("SIDEQUEST_MODE", "demo");
    expect(await (await POST(request())).json()).toMatchObject({ status: "simulated", delivered: false });
    expect(checkBotId).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
