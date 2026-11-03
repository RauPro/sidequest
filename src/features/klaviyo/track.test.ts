import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoOrder } from "@/domain/orders";
import { trackDemoCheckout, trackEvent } from "./track";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("semantic Klaviyo tracking", () => {
  it("records a simulated event without contacting Klaviyo in default demo mode", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await trackEvent("Sidequest Camp Question Asked", { topic: "custom" });
    expect(result?.status).toBe("simulated");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends anonymous client events without a remembered email in live mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
      sessionStorage: { getItem: () => null, setItem: vi.fn() },
      location: { href: "https://sidequest.test/" },
      history: { state: null, replaceState: vi.fn() },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await trackEvent("Sidequest Camp Question Asked", { topic: "custom" });

    expect(result?.status).toBe("accepted");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.data.attributes.profile.data.attributes.email).toBeUndefined();
    expect(body.data.attributes.profile.data.attributes.anonymous_id).toBeTruthy();
  });

  it("marks demo checkout completion without emitting purchase value", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING", "live");
    vi.stubEnv("NEXT_PUBLIC_KLAVIYO_SITE_ID", "AbCdEf");
    vi.stubGlobal("window", {
      localStorage: { getItem: () => null, setItem: vi.fn() },
      sessionStorage: { getItem: () => null, setItem: vi.fn() },
      location: { href: "https://sidequest.test/" },
      history: { state: null, replaceState: vi.fn() },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await trackDemoCheckout(createDemoOrder({ ember: 1 }, "demo-order"));

    expect(result?.status).toBe("accepted");
    const attributes = JSON.parse(fetchMock.mock.calls[0][1].body as string).data.attributes;
    expect(attributes.metric.data.attributes.name).toBe("Sidequest Demo Checkout Completed");
    expect(attributes.properties.is_demo).toBe(true);
    expect(attributes).not.toHaveProperty("value");
    expect(attributes).not.toHaveProperty("value_currency");
  });
});
