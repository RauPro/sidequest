import type { ReactNode } from "react";
import { StoreGameLayout } from "@/features/game/StoreGameLayout";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <StoreGameLayout view="shop">{children}</StoreGameLayout>;
}
