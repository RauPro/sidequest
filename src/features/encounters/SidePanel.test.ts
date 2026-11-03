import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCartStore } from "@/features/cart/store";
import { SidePanel } from "./SidePanel";

afterEach(() => vi.unstubAllEnvs());

describe("sold-out companion panels", () => {
  it("disables Add to bag and shows the raven form", () => {
    vi.stubEnv("NEXT_PUBLIC_SIDEQUEST_SOLD_OUT", "bolt");
    const html = renderToStaticMarkup(createElement(SidePanel, {
      side: { kind: "product", productId: "bolt" },
      cart: {},
      store: createCartStore(),
      receipt: null,
      onAction: () => undefined,
    }));

    expect(html).toContain("Sold out");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Sold out<\/button>/);
    expect(html).toContain("Send a raven when Bolt returns");
    expect(html).toContain("This doesn&#x27;t subscribe you to the newsletter.");
  });
});
