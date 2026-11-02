import type { ReactNode } from "react";
import { CartProvider } from "@/features/cart/CartProvider";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
