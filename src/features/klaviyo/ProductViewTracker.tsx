"use client";

import { useEffect } from "react";
import type { ProductId } from "@/domain/catalog";
import { trackEventOnce } from "./track";

const sources = ["market", "oracle", "shop", "camp"] as const;

export function ProductViewTracker({ productId, source }: { productId: ProductId; source: string }) {
  useEffect(() => {
    const discoverySource = sources.includes(source as (typeof sources)[number])
      ? source as (typeof sources)[number]
      : "shop";
    trackEventOnce(`product:${discoverySource}:${productId}`, "Sidequest Product Viewed", {
      productId,
      discoverySource,
    });
  }, [productId, source]);
  return null;
}
