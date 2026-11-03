import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { guards, jsonRoute } from "./http";
import { rateLimit } from "./rateLimit";

function request(ip?: string) {
  return new Request("https://sidequest.example/api/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ip ? { "x-forwarded-for": ip } : {}),
    },
    body: "{}",
  });
}

afterEach(() => vi.useRealTimers());

describe("best-effort fixed-window rate limits", () => {
  it("allows the configured count and resets after the window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T00:00:00.000Z"));
    const guard = rateLimit("/test/window", 2, 60_000);

    await expect(guard(request("192.0.2.1"))).resolves.toBeUndefined();
    await expect(guard(request("192.0.2.1"))).resolves.toBeUndefined();
    await expect(guard(request("192.0.2.1"))).rejects.toMatchObject({ status: 429, code: "rate_limited", retryAfter: 60 });

    vi.advanceTimersByTime(60_000);
    await expect(guard(request("192.0.2.1"))).resolves.toBeUndefined();
  });

  it("keys windows by route and the first forwarded IP", async () => {
    const firstRoute = rateLimit("/test/route-a", 1, 60_000);
    const secondRoute = rateLimit("/test/route-b", 1, 60_000);

    await firstRoute(request("192.0.2.1, 198.51.100.9"));
    await expect(firstRoute(request("192.0.2.1, 203.0.113.3"))).rejects.toMatchObject({ status: 429 });
    await expect(firstRoute(request("198.51.100.9"))).resolves.toBeUndefined();
    await expect(secondRoute(request("192.0.2.1"))).resolves.toBeUndefined();
    await expect(rateLimit("/test/unknown", 1, 60_000)(request())).resolves.toBeUndefined();
  });

  it("returns 429 and Retry-After through jsonRoute", async () => {
    const route = rateLimit(`/test/json-${crypto.randomUUID()}`, 1, 60_000);
    const handler = jsonRoute(z.object({}).strict(), async () => ({ ok: true }), guards(route));

    expect((await handler(request("203.0.113.10"))).status).toBe(200);
    const limited = await handler(request("203.0.113.10"));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("60");
    expect(await limited.json()).toMatchObject({ error: "rate_limited" });
  });
});
