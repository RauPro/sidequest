import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/oracle/preferences/route";

let requestIp = 0;
const request = (body: unknown) => new Request("https://sidequest.raul.engineer/api/oracle/preferences", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-forwarded-for": `198.51.100.${++requestIp}` },
  body: JSON.stringify(body),
});
beforeEach(() => {
  vi.stubEnv("ORACLE_PROFILE_MODE", "live");
  vi.stubEnv("ORACLE_PROFILE_ALLOWED_EMAILS", "tester@example.com");
  vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "test-key");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("derives and verifies consistent preferences, without exposing a profile or subscribing", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ data: { type: "profile", id: "test-profile", attributes: { properties: { preferred_companion: "moss", desk_mood: "calm", visual_style: "nature" } } } }));
  const response = await POST(request({ email: "tester@example.com", mood: "calm" }));
  expect(await response.json()).toEqual({ status: "saved", saved: true, companion: "moss" });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, init] = vi.mocked(fetch).mock.calls[0];
  expect(url).toBe("https://a.klaviyo.com/api/profile-import");
  expect(JSON.parse(init!.body as string)).toEqual({ data: { type: "profile", attributes: { email: "tester@example.com", properties: { preferred_companion: "moss", desk_mood: "calm", visual_style: "nature" } } } });
});
it("keeps demo saves simulated and gates live writes to invited testers", async () => {
  expect((await POST(request({ email: "other@example.com", mood: "bold" }))).status).toBe(403);
  vi.stubEnv("ORACLE_PROFILE_ALLOWED_EMAILS", "");
  expect((await POST(request({ email: "tester@example.com", mood: "bold" }))).status).toBe(403);
  vi.stubEnv("ORACLE_PROFILE_MODE", "demo");
  expect(await (await POST(request({ email: "tester@example.com", mood: "bold" }))).json()).toEqual({ status: "simulated", saved: false });
  expect(fetch).not.toHaveBeenCalled();
});
it("rejects unknown preferences and arbitrary profile properties", async () => {
  expect((await POST(request({ email: "tester@example.com", mood: "unknown" }))).status).toBe(400);
  expect((await POST(request({ email: "tester@example.com", mood: "bold", properties: { vip: true } }))).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it.each([429, 401, 500])("reports provider failure %s without leaking its body", async status => {
  vi.mocked(fetch).mockResolvedValue(new Response("private provider details", { status }));
  const response = await POST(request({ email: "tester@example.com", mood: "bold" }));
  expect(response.status).toBe(status === 429 ? 429 : 503);
  expect(await response.text()).not.toContain("private provider details");
});
it("does not claim success for a timeout or mismatching saved choice", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("timeout"));
  expect((await POST(request({ email: "tester@example.com", mood: "calm" }))).status).toBe(503);
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: { type: "profile", id: "test", attributes: { properties: { preferred_companion: "ember", desk_mood: "bold", visual_style: "fantasy" } } } }));
  expect((await POST(request({ email: "tester@example.com", mood: "calm" }))).status).toBe(502);
});
