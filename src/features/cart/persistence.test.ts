import { expect, it, vi } from "vitest";
import { createCartStore } from "./store";
import { cartStorageKey, persistCart } from "./persistence";

it("hydrates before subscribing and preserves a saved cart on mount", () => {
  const store = createCartStore();
  const storage = { getItem: vi.fn(() => '{"version":1,"items":{"ember":2}}'), setItem: vi.fn() };
  const unsubscribe = persistCart(store, storage);
  expect(store.getSnapshot()).toEqual({ ember: 2 });
  expect(storage.setItem).not.toHaveBeenCalled();
  store.add("moss");
  expect(storage.setItem).toHaveBeenCalledWith(cartStorageKey, '{"version":1,"items":{"ember":2,"moss":1}}');
  unsubscribe();
  store.clear();
  expect(storage.setItem).toHaveBeenCalledTimes(1);
});

it("keeps the session usable when browser storage is unavailable", () => {
  const store = createCartStore();
  const storage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } };
  const unsubscribe = persistCart(store, storage);
  expect(() => store.add("bolt")).not.toThrow();
  expect(store.getSnapshot()).toEqual({ bolt: 1 });
  unsubscribe();
});

it("does not share visitor state between provider stores", () => {
  const first = createCartStore();
  const second = createCartStore();
  first.add("ember");
  expect(second.getSnapshot()).toEqual({});
  expect(first.getServerSnapshot()).toEqual({});
});
