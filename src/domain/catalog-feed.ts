import { catalog, type ProductId } from "./catalog";
import { isSoldOut } from "./inventory";
import { productImagePath } from "./product-image";

export const storefrontUrl = "https://sidequest.raul.engineer";

export function catalogFeedItemId(productId: ProductId): string {
  return productId;
}

// Flat fields for Klaviyo's custom-source mapping. Prices are USD, not cents.
// Availability is a demo flag, not a claim about physical inventory.
export function createCatalogFeed() {
  return catalog.map((product) => {
    const soldOut = isSoldOut(product.id);
    const available = product.available && !soldOut;
    return {
      id: catalogFeedItemId(product.id),
      title: product.name,
      link: `${storefrontUrl}/products/${product.id}`,
      image_link: `${storefrontUrl}${productImagePath(product.id)}`,
      description: `${product.description} Fictional demo companion; no real purchase or shipment.`,
      price: product.priceMinor / 100,
      currency: product.currency,
      availability: available ? "available" : "unavailable",
      categories: ["SIDEQUEST", "Demo companions", available ? "Available" : "Unavailable"],
      inventory_quantity: available ? 100 : 0,
      inventory_policy: 2,
    };
  });
}
