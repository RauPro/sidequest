"use client";

import Image from "next/image";
import Link from "next/link";
import { catalog, formatMoney } from "@/domain/catalog";
import { maxQuantity } from "@/domain/cart";
import { productCopy } from "@/features/products/product-copy";
import { useCart } from "@/features/cart/CartProvider";
import { trackAddedToCart, trackEventOnce } from "@/features/klaviyo/track";

export function ProductGrid() {
  const { cart, store } = useCart();
  return (
    <div className="shop-products">
      {catalog.map((product) => (
        <article className="rpg-frame shop-product-card" key={product.id}>
          <div className={`shop-product-art shop-product-art--${product.id}`}>
            <Image src={`/game/products/${product.id}.png`} alt={`${product.name} companion`} width={170} height={170} className="game-image" unoptimized />
          </div>
          <h2>{product.name}</h2>
          <p className="shop-product-subtitle">{productCopy[product.id].subtitle}</p>
          <ul className="product-traits" aria-label={`${product.name} traits`}>
            {productCopy[product.id].traits.map((trait) => <li key={trait}>{trait}</li>)}
          </ul>
          <p>{productCopy[product.id].description}</p>
          <p className="product-price">{formatMoney(product.priceMinor)}</p>
          <button
            type="button"
            className="rpg-btn rpg-btn--primary"
            onClick={() => {
              const previousCart = store.getSnapshot();
              store.add(product.id);
              trackAddedToCart(previousCart, store.getSnapshot(), product.id);
            }}
            disabled={!product.available || (cart[product.id] ?? 0) >= maxQuantity}
          >
            Add to bag
          </button>
          <Link className="rpg-btn shop-details-link" href={`/products/${product.id}?source=shop`} onClick={() => trackEventOnce(`product:shop:${product.id}`, "Sidequest Product Viewed", { productId: product.id, discoverySource: "shop" })}>Details</Link>
        </article>
      ))}
    </div>
  );
}
