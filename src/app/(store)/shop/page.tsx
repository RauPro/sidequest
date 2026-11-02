import type { Metadata } from "next";
import { ProductGrid } from "@/features/shop/ProductGrid";
import { CartPanel } from "@/features/cart/CartPanel";
import { OraclePanel } from "@/features/oracle/OraclePanel";
import { SupportPanel } from "@/features/support/SupportPanel";
import { SubscriptionForm } from "@/features/subscription/SubscriptionForm";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return <><div className="page-intro"><p className="eyebrow">The companion collection</p><h1>Find your desk companion.</h1><p>All the essentials, with the same bag as the village.</p></div>
    <ProductGrid /><CartPanel /><div className="support-grid"><OraclePanel /><SupportPanel /></div><SubscriptionForm />
  </>;
}
