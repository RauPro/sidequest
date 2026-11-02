import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/catalog/klaviyo.json/route";

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
      expect(item.currency).toBe("USD");
      const image = readFileSync(`public/images/products/${item.id}.png`);
      expect(image.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(image.readUInt32BE(16)).toBe(512);
      expect(image.readUInt32BE(20)).toBe(512);
    }
  });
});
