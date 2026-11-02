import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as subscribe } from "@/app/api/subscribe/route";
import { POST as identify } from "@/app/api/identify/route";
import { POST as record } from "@/app/api/events/route";

function request(body: unknown, path = "subscribe") {
  return new Request(`http://localhost/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.stubEnv("SIDEQUEST_MODE", "demo");
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
    const event = { email: "tester@example.com", event: "Sidequest Product Viewed", eventId: "0305ce7f-9963-4ab8-9bf9-d702c0ac76fd", properties: { productId: "ember" } };
    expect((await record(request(event, "events"))).status).toBe(200);
    expect((await record(request({ ...event, event: "Placed Order" }, "events"))).status).toBe(400);
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
