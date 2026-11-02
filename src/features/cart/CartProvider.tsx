"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createCartStore, type CartStore } from "./store";
import { persistCart } from "./persistence";

const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createCartStore);
  useEffect(() => {
    try { return persistCart(store, window.localStorage); } catch { /* Storage access is optional. */ }
  }, [store]);
  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}

export function useCart() {
  const store = useContext(CartContext);
  if (!store) throw new Error("CartProvider is required");
  const cart = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { cart, store };
}
