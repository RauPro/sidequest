import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/features/shop/ProductGrid";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <div className="shop-view">
      <header className="shop-intro">
        <p className="rpg-eyebrow">WILLOW MARKET</p>
        <h1>Milo&apos;s Market Hall</h1>
        <div className="shop-milo rpg-frame">
          <Image src="/game/portraits/milo.webp" alt="" width={64} height={64} className="game-image" aria-hidden="true" />
          <p><strong>Milo · Merchant</strong><br />Browse at your leisure — same bag as in the village.</p>
        </div>
      </header>
      <ProductGrid />
      <section className="village-services" aria-labelledby="village-services-title">
        <h2 id="village-services-title">Village services</h2>
        <div className="village-service-tiles">
          <Link className="village-service-tile rpg-frame" href="/?visit=oracle">
            <Image src="/game/portraits/oracle.webp" alt="" width={72} height={72} className="game-image" aria-hidden="true" />
            <span><strong>The Oracle</strong><small>Seek a companion by the stars</small></span>
          </Link>
          <Link className="village-service-tile rpg-frame" href="/?visit=camp">
            <Image src="/game/portraits/finn.webp" alt="" width={72} height={72} className="game-image" aria-hidden="true" />
            <span><strong>Camp</strong><small>Ask Finn about the village</small></span>
          </Link>
          <Link className="village-service-tile rpg-frame" href="/?visit=post">
            <Image src="/game/portraits/pip.webp" alt="" width={72} height={72} className="game-image" aria-hidden="true" />
            <span><strong>Post Office</strong><small>Letters from Willow Market</small></span>
          </Link>
        </div>
      </section>
    </div>
  );
}
