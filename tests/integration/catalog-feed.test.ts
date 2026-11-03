import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/catalog/klaviyo.json/route";
import { buildViewedProduct } from "@/domain/klaviyoMetrics";

afterEach(() => vi.unstubAllEnvs());

describe("public Klaviyo catalog contract", () => {
  it("exports stable IDs, dollar prices and public links without caching", async () => {
    const response = GET();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");
    const items = await response.json();
    expect(items.map((item: { id: string; price: number }) => [item.id, item.price]))
      .toEqual([["ember", 24], ["moss", 18], ["bolt", 28]]);
    for (const item of items) {
      expect(item.title).toBeTruthy();
      expect(item.description).toContain("Fictional demo");
      expect(item.link).toBe(`https://sidequest.raul.engineer/products/${item.id}`);
      expect(item.image_link).toBe(`https://sidequest.raul.engineer/images/products/${item.id}.png`);
      expect(buildViewedProduct(item.id, "market", "https://sidequest.raul.engineer").properties.ImageURL).toBe(item.image_link);
      expect(item.currency).toBe("USD");
      expect(item.inventory_policy).toBe(2);
      expect(item.inventory_quantity).toBe(100);
      const image = readFileSync(`public/images/products/${item.id}.png`);
      expect(image.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(image.readUInt32BE(16)).toBe(512);
      expect(image.readUInt32BE(20)).toBe(512);
    }
  });

  it("exports zero inventory for configured sold-out products", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_SOLD_OUT", "bolt");
    const response = GET();
    const items = await response.json();
    expect(items.find((item: { id: string }) => item.id === "bolt")).toMatchObject({
      availability: "unavailable",
      inventory_quantity: 0,
      inventory_policy: 2,
    });
    expect(items.find((item: { id: string }) => item.id === "ember")).toMatchObject({ inventory_quantity: 100 });
  });
});
