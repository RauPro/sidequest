import { cartLines, cartTotal, type Cart } from "./cart";
import { getProduct, type ProductId } from "./catalog";
import { productImagePath } from "./product-image";

export type KlaviyoMetric = {
  metric: string;
  properties: Record<string, unknown>;
  value?: number;
};

const categories = ["SIDEQUEST", "Demo companions"];

function dollars(minor: number): number {
  return minor / 100;
}

function productMetrics(productId: ProductId, origin: string) {
  const product = getProduct(productId);
  const imageURL = `${origin}${productImagePath(product.id)}`;
  const url = `${origin}/products/${product.id}`;
  return {
    product,
    imageURL,
    url,
    sku: `SIDEQUEST-${product.id.toUpperCase()}`,
    categories: [...categories],
  };
}

function cartItems(cart: Cart, origin: string) {
  return cartLines(cart).map(({ product, quantity, totalMinor }) => {
    const metrics = productMetrics(product.id, origin);
    return {
      ProductID: product.id,
      SKU: metrics.sku,
      ProductName: product.name,
      Quantity: quantity,
      ItemPrice: dollars(product.priceMinor),
      RowTotal: dollars(totalMinor),
      ProductURL: metrics.url,
      ImageURL: metrics.imageURL,
      ProductCategories: metrics.categories,
    };
  });
}

function cartCategories(cart: Cart): string[] {
  return [...new Set(cartLines(cart).flatMap(() => categories))];
}

export function buildViewedProduct(
  productId: ProductId,
  discoverySource: "market" | "oracle" | "shop" | "camp",
  origin: string,
): KlaviyoMetric {
  const { product, imageURL, url, sku, categories: productCategories } = productMetrics(productId, origin);
  const price = dollars(product.priceMinor);
  return {
    metric: "Viewed Product",
    value: price,
    properties: {
      ProductName: product.name,
      ProductID: product.id,
      SKU: sku,
      Categories: productCategories,
      ImageURL: imageURL,
      URL: url,
      Brand: "SIDEQUEST",
      Price: price,
      DiscoverySource: discoverySource,
    },
  };
}

export function buildAddedToCart(
  previousCart: Cart,
  cart: Cart,
  addedProductId: ProductId,
  origin: string,
): KlaviyoMetric | null {
  const addedQuantity = (cart[addedProductId] ?? 0) - (previousCart[addedProductId] ?? 0);
  if (addedQuantity <= 0) return null;
  const { product, imageURL, url, sku, categories: productCategories } = productMetrics(addedProductId, origin);
  const value = dollars(cartTotal(cart));
  return {
    metric: "Added to Cart",
    value,
    properties: {
      $value: value,
      AddedItemProductName: product.name,
      AddedItemProductID: product.id,
      AddedItemSKU: sku,
      AddedItemCategories: productCategories,
      AddedItemImageURL: imageURL,
      AddedItemURL: url,
      AddedItemPrice: dollars(product.priceMinor),
      AddedItemQuantity: addedQuantity,
      ItemNames: cartLines(cart).map(({ product: item }) => item.name),
      CheckoutURL: `${origin}/shop`,
      Items: cartItems(cart, origin),
    },
  };
}

export function buildStartedCheckout(cart: Cart, checkoutId: string, origin: string): KlaviyoMetric {
  const value = dollars(cartTotal(cart));
  return {
    metric: "Started Checkout",
    value,
    properties: {
      $event_id: checkoutId,
      $value: value,
      ItemNames: cartLines(cart).map(({ product }) => product.name),
      CheckoutURL: `${origin}/shop`,
      Categories: cartCategories(cart),
      Items: cartItems(cart, origin),
    },
  };
}
