import { emptyCart, setQuantity, type Cart } from "@/domain/cart";
import type { ProductId } from "@/domain/catalog";

export function createCartStore() {
  let snapshot = emptyCart;
  const listeners = new Set<() => void>();
  function replace(next: Cart) {
    snapshot = next;
    listeners.forEach((listener) => listener());
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => emptyCart,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    replace,
    add: (id: ProductId) => replace(setQuantity(snapshot, id, (snapshot[id] ?? 0) + 1)),
    set: (id: ProductId, quantity: number) => replace(setQuantity(snapshot, id, quantity)),
    clear: () => replace(emptyCart),
  };
}

export type CartStore = ReturnType<typeof createCartStore>;
