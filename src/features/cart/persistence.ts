import { restoreCart } from "@/domain/cart";
import type { CartStore } from "./store";

export const cartStorageKey = "sidequest:cart:v1";

export function persistCart(store: CartStore, storage: Pick<Storage, "getItem" | "setItem">) {
  try { store.replace(restoreCart(storage.getItem(cartStorageKey))); } catch { /* Keep the in-memory cart. */ }
  return store.subscribe(() => {
    try {
      storage.setItem(cartStorageKey, JSON.stringify({ version: 1, items: store.getSnapshot() }));
    } catch { /* Storage may be disabled or full. Shopping still works. */ }
  });
}
