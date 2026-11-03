import { afterEach, describe, expect, it, vi } from "vitest";
import { getLedgerSnapshot } from "./ledger";
import { buildBackInStockPayload, catalogVariantId, sendBackInStockRequest } from "./backInStock";

function createStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

function mockWindow() {
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  vi.stubGlobal("window", { localStorage, sessionStorage, dispatchEvent: vi.fn() });
  return localStorage;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Klaviyo back-in-stock subscriptions", () => {
  it("builds the catalog variant relationship from the feed item ID", () => {
    expect(catalogVariantId("bolt")).toBe("$custom:::$default:::bolt");
    expect(buildBackInStockPayload("raven@example.com", "bolt")).toEqual({
      data: {
        type: "back-in-stock-subscription",
        attributes: {
          channels: ["EMAIL"],
          profile: { data: { type: "profile", attributes: { email: "raven@example.com" } } },
        },
        relationships: {
          variant: { data: { type: "catalog-variant", id: "$custom:::$default:::bolt" } },
        },
      },
    });
  });

  it("simulates in demo mode without fetching and remembers the email", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "demo");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    const localStorage = mockWindow();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendBackInStockRequest(" raven@example.com ", "bolt");

    expect(result).toMatchObject({ status: "simulated" });
    expect(result.message).toContain("simulated");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("sidequest:identity:v1")).toBe("raven@example.com");
    expect(getLedgerSnapshot()[0]).toMatchObject({ operation: "back-in-stock", status: "simulated" });
  });

  it("posts the Client API request and reports only HTTP 202 as accepted", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    const localStorage = mockWindow();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendBackInStockRequest("raven@example.com", "bolt");

    expect(result).toEqual({ status: "accepted", message: "Raven sent — Klaviyo accepted your request" });
    expect(localStorage.getItem("sidequest:identity:v1")).toBe("raven@example.com");
    expect(getLedgerSnapshot()[0]).toMatchObject({ operation: "back-in-stock", status: "accepted" });
    expect(getLedgerSnapshot()[0].detail).not.toContain("raven@example.com");
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://a.klaviyo.com/client/back-in-stock-subscriptions?company_id=AbCdEf");
    expect(request).toMatchObject({
      method: "POST",
      headers: {
        revision: "2026-10-15",
        "content-type": "application/vnd.api+json",
        accept: "application/vnd.api+json",
      },
      keepalive: true,
    });
    expect(JSON.parse(request.body as string)).toEqual(buildBackInStockPayload("raven@example.com", "bolt"));
  });

  it("does not remember the email when the provider request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    const localStorage = mockWindow();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 400 })));

    const result = await sendBackInStockRequest("raven@example.com", "bolt");

    expect(result.status).toBe("failed");
    expect(localStorage.getItem("sidequest:identity:v1")).toBeNull();
    expect(getLedgerSnapshot()[0]).toMatchObject({ operation: "back-in-stock", status: "failed" });
  });
});
