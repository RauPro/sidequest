import { describe, expect, it } from "vitest";
import { cartCount, cartTotal, emptyCart, restoreCart, setQuantity } from "./cart";
import { createDemoOrder } from "./orders";
import { recommend } from "./recommendations";

describe("cart domain", () => {
  it("calculates units and totals in minor currency units", () => {
    const cart = setQuantity(setQuantity(emptyCart, "ember", 2), "moss", 1);
    expect(cartCount(cart)).toBe(3);
    expect(cartTotal(cart)).toBe(6600);
    expect(cartTotal(setQuantity(cart, "ember", 0))).toBe(1800);
    expect(emptyCart).toEqual({});
  });
  it.each([-1, 0.5, NaN, Infinity, 100])("rejects invalid quantity %s", (quantity) => {
    expect(() => setQuantity(emptyCart, "ember", quantity)).toThrow("Invalid quantity");
  });
  it("recovers only supported persisted products and quantities", () => {
    expect(restoreCart(JSON.stringify({ version: 1, items: { ember: 2, moss: -1, bolt: 999, retired: 1 } }))).toEqual({ ember: 2 });
    expect(restoreCart("broken")).toEqual({});
    expect(restoreCart(JSON.stringify({ version: 2, items: { ember: 1 } }))).toEqual({});
  });
  it("retains a reviewable order snapshot independently of the cart", () => {
    const cart = setQuantity(emptyCart, "ember", 2);
    const order = createDemoOrder(cart, "demo-order");
    const cleared = setQuantity(cart, "ember", 0);
    expect(cartCount(cleared)).toBe(0);
    expect(order.totalMinor).toBe(4800);
    expect(order.lines[0].quantity).toBe(2);
    expect(() => createDemoOrder(emptyCart, "empty")).toThrow();
  });
});

it("offers a deterministic recommendation for every companion", () => {
  expect([recommend("bold").productId, recommend("calm").productId, recommend("curious").productId]).toEqual(["ember", "moss", "bolt"]);
  expect(recommend("calm")).toEqual(recommend("calm"));
  expect(recommend("calm").explanation).toContain("calm");
});
