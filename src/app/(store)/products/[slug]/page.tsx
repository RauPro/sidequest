import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, formatMoney, getProduct, isProductId } from "@/domain/catalog";
import { AddProductToBag } from "@/features/products/AddProductToBag";
import { productCopy } from "@/features/products/product-copy";
import styles from "@/features/products/product-page.module.css";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return catalog.map(({ id }) => ({ slug: id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isProductId(slug)) notFound();
  return {
    title: `${getProduct(slug).name} — Desk companion`,
    description: productCopy[slug].description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  if (!isProductId(slug)) notFound();
  const product = getProduct(slug);
  const copy = productCopy[slug];

  return (
    <article className={styles.page}>
      <nav className={styles.navigation} aria-label="Product navigation">
        <Link href="/shop" className="rpg-btn">← Back to Market Hall</Link>
        <Link href="/?visit=market" className="rpg-btn">Find in the village</Link>
      </nav>
      <div className={styles.hero}>
        <figure className={`${styles.figure} rpg-frame`}>
          <div className={styles.art}>
            <Image src={`/game/products/${product.id}.png`} alt={`${product.name} companion`} width={420} height={420} className="game-image" unoptimized />
          </div>
          <figcaption>Willow Market · Demo companion</figcaption>
        </figure>
        <div>
          <p className={styles.eyebrow}>Market Hall / Companions</p>
          <h1 className={styles.name}>{product.name}</h1>
          <p className={styles.subtitle}>{copy.subtitle}</p>
          <p className={styles.description}>{copy.description}</p>
          <ul className={styles.traits} aria-label={`${product.name}'s personality`}>
            {copy.traits.map((trait) => <li key={trait}>{trait}</li>)}
          </ul>
          <p className={styles.price}>{formatMoney(product.priceMinor)}<span>USD · demo price</span></p>
          <p className={styles.availability}>{product.available ? "Available in the demo" : "Currently unavailable"}</p>
          <AddProductToBag id={product.id} />
        </div>
      </div>
      <section className={styles.others}>
        <h2>Meet the other companions</h2>
        <nav aria-label="Other companions">
          {catalog.filter(({ id }) => id !== product.id).map((other) => (
            <Link key={other.id} href={`/products/${other.id}`}>
              <span className={styles.dot} style={{ backgroundColor: other.color }} aria-hidden="true" />
              Meet {other.name} →
            </Link>
          ))}
        </nav>
      </section>
    </article>
  );
}
