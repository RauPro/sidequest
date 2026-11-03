import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as subscribe } from "@/app/api/subscribe/route";
import { POST as identify } from "@/app/api/identify/route";
import { POST as record } from "@/app/api/events/route";
import { POST as campChat } from "@/app/api/camp/chat/route";

let requestIp = 0;
function request(body: unknown, path = "subscribe") {
  return new Request(`http://localhost/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `198.51.100.${++requestIp}` }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.stubEnv("SIDEQUEST_MODE", "demo");
  vi.stubEnv("KLAVIYO_LIVE_ALLOWED_EMAILS", "");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected external request"); }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("scaffold API contracts", () => {
  it("returns explicit simulation and performs no external request", async () => {
    const response = await subscribe(request({ email: "tester@example.com", consent: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "simulated", mode: "demo", delivered: false });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([
    { email: "tester@example.com", consent: false },
    { email: "invalid", consent: true },
    { email: "tester@example.com", consent: true, arbitrary: "field" },
  ])("rejects invalid subscriptions without provider calls", async (body) => {
    expect((await subscribe(request(body))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON and oversized bodies", async () => {
    const invalid = new Request("http://localhost/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
    expect((await subscribe(invalid)).status).toBe(400);
    expect((await subscribe(request({ email: "x".repeat(17_000), consent: true }))).status).toBe(413);
  });
  it("rejects foreign browser origins", async () => {
    const foreign = request({ email: "tester@example.com", consent: true });
    foreign.headers.set("origin", "https://unrelated.example");
    expect((await subscribe(foreign)).status).toBe(403);
  });
  it("accepts the request Host when Next.js normalizes its internal URL", async () => {
    const local = request({ email: "tester@example.com", consent: true });
    local.headers.set("host", "127.0.0.1:3100");
    local.headers.set("origin", "http://127.0.0.1:3100");
    expect((await subscribe(local)).status).toBe(200);
    local.headers.set("origin", "null");
    expect((await subscribe(local)).status).toBe(403);
  });
  it("supports identified preference and allowlisted event contracts", async () => {
    expect((await identify(request({ email: "tester@example.com", preferences: { preferredCompanion: "ember" } }, "identify"))).status).toBe(200);
    const event = {
      email: "tester@example.com",
      event: "Sidequest Product Viewed",
      eventId: "0305ce7f-9963-4ab8-9bf9-d702c0ac76fd",
      properties: { productId: "ember", discoverySource: "market" },
    };
    expect((await record(request(event, "events"))).status).toBe(200);
    expect((await record(request({ ...event, event: "Placed Order" }, "events"))).status).toBe(400);
    const campQuestion = {
      email: "tester@example.com",
      event: "Sidequest Camp Question Asked",
      eventId: "0305ce7f-9963-4ab8-9bf9-d702c0ac76fd",
      properties: { topic: "checkout" },
    };
    expect((await record(request(campQuestion, "events"))).status).toBe(200);
    expect((await record(request({ ...campQuestion, properties: { topic: "checkout", question: "raw user text" } }, "events"))).status).toBe(400);
    const oracleCompletion = {
      email: "tester@example.com",
      event: "Sidequest Oracle Completed",
      eventId: "0305ce7f-9963-4ab8-9bf9-d702c0ac76fd",
      properties: { recommendedProductId: "ember", ruleVersion: "2", deskMood: "bold", visualStyle: "fantasy" },
    };
    expect((await record(request(oracleCompletion, "events"))).status).toBe(200);
    expect((await record(request({ ...oracleCompletion, properties: { ...oracleCompletion.properties, ruleVersion: "1" } }, "events"))).status).toBe(400);
    expect((await record(request({
      email: "tester@example.com",
      event: "Sidequest Location Visited",
      eventId: "0305ce7f-9963-4ab8-9bf9-d702c0ac76fd",
      properties: { location: "camp" },
    }, "events"))).status).toBe(200);
  });
  it("keeps the Camp API demo-only and rejects malformed chat requests", async () => {
    const response = await campChat(request({ messages: [{ role: "user", content: "How does checkout work?" }] }, "camp/chat"));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({ status: "simulated", open: true });
    expect(result).not.toHaveProperty("followUp");
    expect((await campChat(request({ messages: [{ role: "agent", content: "Hello" }] }, "camp/chat"))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("fails closed for live mode without an allowlisted recipient", async () => {
    vi.stubEnv("SIDEQUEST_MODE", "live");
    vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "");
    expect((await subscribe(request({ email: "tester@example.com", consent: true }))).status).toBe(503);
    vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "test-placeholder-not-a-secret");
    vi.stubEnv("KLAVIYO_LIST_ID", "test-list");
    vi.stubEnv("KLAVIYO_API_REVISION", "2026-10-15");
    const response = await subscribe(request({ email: "tester@example.com", consent: true }));
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("test-placeholder-not-a-secret");
    expect(fetch).not.toHaveBeenCalled();
  });
});
