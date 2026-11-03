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
      <section className="village-services rpg-frame" aria-labelledby="village-services-title">
        <h2 id="village-services-title">Village services</h2>
        <Link href="/?visit=oracle">Visit the Oracle</Link>
        <Link href="/?visit=camp">Visit Camp</Link>
        <Link href="/?visit=post">Visit the Post Office</Link>
      </section>
    </div>
  );
}
