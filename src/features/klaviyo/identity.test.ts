import { afterEach, describe, expect, it, vi } from "vitest";
import { anonymousIdKey, captureKlaviyoIdentity, getKlaviyoIdentifiers, klaviyoKeyKey } from "./identity";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("Klaviyo client identity", () => {
  it("composes remembered email, _kx, and a stable anonymous UUID", () => {
    const localStorage = createStorage({
      "sidequest:identity:v1": "visitor@example.com",
      [klaviyoKeyKey]: "link-token",
    });
    vi.stubGlobal("window", { localStorage, location: { href: "https://sidequest.test/" }, history: { replaceState: vi.fn() } });

    const first = getKlaviyoIdentifiers();
    const second = getKlaviyoIdentifiers();

    expect(first).toMatchObject({ email: "visitor@example.com", _kx: "link-token" });
    expect(first.anonymous_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(second.anonymous_id).toBe(first.anonymous_id);
    expect(localStorage.getItem(anonymousIdKey)).toBe(first.anonymous_id);
  });

  it("captures _kx and removes only that parameter while preserving the rest of the URL", () => {
    const localStorage = createStorage();
    const location = { href: "https://sidequest.test/products/ember?_kx=mail-token&source=shop&keep=1#details" };
    const history = {
      state: { index: 3 },
      replaceState: vi.fn((_state, _title, path) => { location.href = `https://sidequest.test${path}`; }),
    };
    vi.stubGlobal("window", { localStorage, location, history });

    captureKlaviyoIdentity();

    expect(localStorage.getItem(klaviyoKeyKey)).toBe("mail-token");
    expect(history.replaceState).toHaveBeenCalledWith(history.state, "", "/products/ember?source=shop&keep=1#details");
    expect(new URL(location.href).searchParams.has("_kx")).toBe(false);
  });
});
