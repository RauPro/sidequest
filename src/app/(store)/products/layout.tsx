import type { ReactNode } from "react";
import { StoreGameLayout } from "@/features/game/StoreGameLayout";

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <StoreGameLayout view="product">{children}</StoreGameLayout>;
}
