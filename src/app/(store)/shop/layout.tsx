import Link from "next/link";
import type { ReactNode } from "react";
import { BagCount } from "@/features/cart/BagCount";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <><header className="site-header">
    <Link href="/" className="brand">SIDEQUEST</Link>
    <nav aria-label="Main navigation"><Link href="/">Village</Link><Link href="/shop">Shop view</Link><BagCount /></nav>
  </header><main id="main">{children}</main>
    <footer>Willow Market · Development foundation · All products and purchases are fictional.</footer></>;
}
