import { afterEach, describe, expect, it, vi } from "vitest";
import { buildClientEventBody } from "./clientApi";

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

async function freshApi() {
  vi.resetModules();
  return import("./clientApi");
}

function mockWindow() {
  vi.stubGlobal("window", {
    localStorage: storage({
      "sidequest:identity:v1": "visitor@example.com",
      "sidequest:kx:v1": "email-link-token",
      "sidequest:anon:v1": "anon-uuid",
    }),
    sessionStorage: storage(),
    location: { href: "https://sidequest.test/" },
    history: { state: null, replaceState: vi.fn() },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("Klaviyo Client API", () => {
  it("simulates in demo mode without making a network request", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "demo");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    mockWindow();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sendClientEvent: send } = await freshApi();

    const result = await send({ metric: "Viewed Product", properties: { ProductID: "ember" }, value: 24, uniqueId: "event-1" });

    expect(result.status).toBe("simulated");
    expect(result.detail).toContain("unique_id event-1…");
    expect(result.detail).toContain("ember · $24.00");
    expect(result.detail).toContain("simulated, no request made");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the verified URL, headers, identifiers, and JSON:API body", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    mockWindow();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendClientEvent: send } = await freshApi();

    const result = await send({
      metric: "Viewed Product",
      properties: { ProductName: "Ember", ProductID: "ember" },
      value: 24,
      uniqueId: "event-1",
    });

    expect(result.status).toBe("accepted");
    expect(result.detail).toContain("unique_id event-1… · Ember · $24.00 · HTTP 202 accepted");
    const { getLedgerSnapshot } = await import("./ledger");
    expect(getLedgerSnapshot()[0].detail).toBe(result.detail);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://a.klaviyo.com/client/events?company_id=AbCdEf");
    expect(request).toMatchObject({
      method: "POST",
      headers: {
        revision: "2026-10-15",
        "content-type": "application/vnd.api+json",
        accept: "application/vnd.api+json",
      },
      keepalive: true,
    });
    expect(JSON.parse(request.body as string)).toEqual({
      data: {
        type: "event",
        attributes: {
          metric: { data: { type: "metric", attributes: { name: "Viewed Product" } } },
          profile: {
            data: {
              type: "profile",
              attributes: {
                email: "visitor@example.com",
                _kx: "email-link-token",
                anonymous_id: "anon-uuid",
              },
            },
          },
          properties: { ProductName: "Ember", ProductID: "ember" },
          unique_id: "event-1",
          value: 24,
          value_currency: "USD",
        },
      },
    });
  });

  it("reports non-202 HTTP responses as failed", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    mockWindow();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    const { sendClientEvent: send } = await freshApi();

    const result = await send({ metric: "Viewed Product", properties: {}, uniqueId: "unexpected-200" });

    expect(result.status).toBe("failed");
    expect(result.detail).toContain("HTTP 200 failed");
  });

  it("omits value fields for custom events", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    mockWindow();
    const body = buildClientEventBody({ metric: "Sidequest Demo Checkout Completed", properties: { is_demo: true }, uniqueId: "event-2" });
    expect(body.data.attributes).not.toHaveProperty("value");
    expect(body.data.attributes).not.toHaveProperty("value_currency");
  });

  it("summarizes the key property on custom events", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "demo");
    mockWindow();
    const { sendClientEvent: send } = await freshApi();

    const result = await send({
      metric: "Sidequest Letter Opened",
      properties: { letter: "ember" },
      uniqueId: "letter-1234",
    });

    expect(result.detail).toContain("unique_id letter-1… · letter: ember · simulated, no request made");
  });

  it("retries a 5xx once with the exact same encoded body and unique ID", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    mockWindow();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendClientEvent: send } = await freshApi();

    const pending = send({ metric: "Added to Cart", properties: { $value: 24 }, value: 24, uniqueId: "stable-id" });
    await vi.advanceTimersByTimeAsync(500);
    const result = await pending;

    expect(result.status).toBe("accepted");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toBe(fetchMock.mock.calls[1][1].body);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string).data.attributes.unique_id).toBe("stable-id");
  });

  it("retries a network error once with the same body and ID", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    mockWindow();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendClientEvent: send } = await freshApi();

    const pending = send({ metric: "Viewed Product", properties: {}, uniqueId: "retry-id" });
    await vi.advanceTimersByTimeAsync(500);
    const result = await pending;

    expect(result.status).toBe("accepted");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toBe(fetchMock.mock.calls[1][1].body);
  });

  it("retries a 429 once when Retry-After is no more than five seconds", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    mockWindow();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "2" } }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendClientEvent: send } = await freshApi();

    const pending = send({ metric: "Viewed Product", properties: {}, uniqueId: "rate-limit-retry" });
    await vi.advanceTimersByTimeAsync(2_000);
    const result = await pending;

    expect(result.status).toBe("accepted");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toBe(fetchMock.mock.calls[1][1].body);
  });

  it("does not retry a 429 whose Retry-After exceeds five seconds", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    mockWindow();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { "Retry-After": "6" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendClientEvent: send } = await freshApi();

    const result = await send({ metric: "Viewed Product", properties: {}, uniqueId: "rate-limited" });

    expect(result.status).toBe("failed");
    expect(result.detail).toContain("HTTP 429 failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("simulates rather than sending when live tracking has an invalid site ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "bad");
    mockWindow();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sendClientEvent: send } = await freshApi();

    const result = await send({ metric: "Viewed Product", properties: {}, uniqueId: "invalid-site" });

    expect(result.status).toBe("simulated");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
