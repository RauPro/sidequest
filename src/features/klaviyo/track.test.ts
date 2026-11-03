import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./track";

afterEach(() => vi.unstubAllGlobals());

describe("semantic Klaviyo tracking", () => {
  it("does not send events without a remembered identity", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    trackEvent("Sidequest Camp Question Asked", { topic: "custom" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
