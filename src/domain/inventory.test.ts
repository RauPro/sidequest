import { afterEach, describe, expect, it, vi } from "vitest";
import { setQuantity } from "./cart";
import { isSoldOut, parseSoldOut } from "./inventory";

afterEach(() => vi.unstubAllEnvs());

describe("sold-out inventory", () => {
  it("parses known comma-separated product IDs and ignores unknown values", () => {
    expect(parseSoldOut(" bolt,unknown, moss, ")).toEqual(new Set(["bolt", "moss"]));
    expect(parseSoldOut()).toEqual(new Set());
  });

  it("blocks adding sold-out products to the cart", () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_SOLD_OUT", "bolt");
    expect(isSoldOut("bolt")).toBe(true);
    expect(isSoldOut("ember")).toBe(false);
    expect(() => setQuantity({}, "bolt", 1)).toThrow("Product unavailable");
    expect(setQuantity({ bolt: 1 }, "bolt", 0)).toEqual({});
  });
});
