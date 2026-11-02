import { catalog } from "./catalog";

export const storefrontUrl = "https://sidequest.raul.engineer";

// Flat fields for Klaviyo's custom-source mapping. Prices are USD, not cents.
// Availability is a demo flag, not a claim about physical inventory.
export function createCatalogFeed() {
  return catalog.map((product) => ({
    id: product.id,
    title: product.name,
    link: `${storefrontUrl}/products/${product.id}`,
    image_link: `${storefrontUrl}/images/products/${product.id}.png`,
    description: `${product.description} Fictional demo companion; no real purchase or shipment.`,
    price: product.priceMinor / 100,
    currency: product.currency,
    availability: product.available ? "available" : "unavailable",
    categories: ["SIDEQUEST", "Demo companions", product.available ? "Available" : "Unavailable"],
  }));
}
