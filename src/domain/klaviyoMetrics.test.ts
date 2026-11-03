import { describe, expect, it } from "vitest";
import { buildAddedToCart, buildStartedCheckout, buildViewedProduct } from "./klaviyoMetrics";

describe("Klaviyo metric builders", () => {
  it("builds the standard Viewed Product fields in dollars with absolute URLs", () => {
    expect(buildViewedProduct("ember", "market", "https://store.example")).toEqual({
      metric: "Viewed Product",
      value: 24,
      properties: {
        ProductName: "Ember",
        ProductID: "ember",
        SKU: "SIDEQUEST-EMBER",
        Categories: ["SIDEQUEST", "Demo companions"],
        ImageURL: "https://store.example/game/products/ember.png",
        URL: "https://store.example/products/ember",
        Brand: "SIDEQUEST",
        Price: 24,
        DiscoverySource: "market",
      },
    });
  });

  it("includes cart totals, added-item details, and complete item rows", () => {
    expect(buildAddedToCart({}, { ember: 2, moss: 1 }, "ember", "https://store.example")).toEqual({
      metric: "Added to Cart",
      value: 66,
      properties: {
        $value: 66,
        AddedItemProductName: "Ember",
        AddedItemProductID: "ember",
        AddedItemSKU: "SIDEQUEST-EMBER",
        AddedItemCategories: ["SIDEQUEST", "Demo companions"],
        AddedItemImageURL: "https://store.example/game/products/ember.png",
        AddedItemURL: "https://store.example/products/ember",
        AddedItemPrice: 24,
        AddedItemQuantity: 2,
        ItemNames: ["Ember", "Moss"],
        CheckoutURL: "https://store.example/shop",
        Items: [
          {
            ProductID: "ember",
            SKU: "SIDEQUEST-EMBER",
            ProductName: "Ember",
            Quantity: 2,
            ItemPrice: 24,
            RowTotal: 48,
            ProductURL: "https://store.example/products/ember",
            ImageURL: "https://store.example/game/products/ember.png",
            ProductCategories: ["SIDEQUEST", "Demo companions"],
          },
          {
            ProductID: "moss",
            SKU: "SIDEQUEST-MOSS",
            ProductName: "Moss",
            Quantity: 1,
            ItemPrice: 18,
            RowTotal: 18,
            ProductURL: "https://store.example/products/moss",
            ImageURL: "https://store.example/game/products/moss.png",
            ProductCategories: ["SIDEQUEST", "Demo companions"],
          },
        ],
      },
    });
  });

  it("does not build Added to Cart events for unchanged or decreased quantities", () => {
    expect(buildAddedToCart({ ember: 1 }, { ember: 1 }, "ember", "https://store.example")).toBeNull();
    expect(buildAddedToCart({ ember: 2 }, { ember: 1 }, "ember", "https://store.example")).toBeNull();
  });

  it("builds Started Checkout with a cart event ID and dollar totals", () => {
    const metric = buildStartedCheckout({ bolt: 1 }, "cart-session-1", "https://store.example");
    expect(metric.metric).toBe("Started Checkout");
    expect(metric.value).toBe(28);
    expect(metric.properties).toMatchObject({
      $event_id: "cart-session-1",
      $value: 28,
      ItemNames: ["Bolt"],
      CheckoutURL: "https://store.example/shop",
      Categories: ["SIDEQUEST", "Demo companions"],
      Items: [{ ProductID: "bolt", Quantity: 1, ItemPrice: 28, RowTotal: 28 }],
    });
  });
});
