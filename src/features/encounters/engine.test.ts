import { describe, expect, it } from "vitest";
import { applyEncounterAction, chooseEncounterOption, createEncounterState } from "./engine";
import { getEncounterNode } from "./market";
import type { EncounterContext } from "./types";

const context: EncounterContext = { productId: "ember", cartCount: 0, receipt: null };

describe("Market encounter", () => {
  it("opens the exact introduction and browses the product carousel", () => {
    let state = createEncounterState("market");
    let node = getEncounterNode(state, context)!;
    expect(node.text).toBe("Welcome to Willow Market, traveler! Every desk needs a little adventure. Care to meet my companions?");

    state = chooseEncounterOption(state, node, "browse").state;
    node = getEncounterNode(state, context)!;
    expect(node.text).toBe("Ember's a brave little dragon. Warms any desk — and your coffee, if you ask nicely.");
    expect(node.side).toEqual({ kind: "product", productId: "ember", browsing: true });

    state = chooseEncounterOption(state, node, "next").state;
    expect(state.productId).toBe("moss");
    expect(getEncounterNode(state, { ...context, productId: state.productId })?.text).toBe(
      "Moss is the calmest slime this side of the river. Water optional.",
    );
    state = chooseEncounterOption(state, getEncounterNode(state, context)!, "previous").state;
    expect(state.productId).toBe("ember");
  });

  it("adds the selected companion, opens the bag, and closes cleanly", () => {
    const state = createEncounterState("market");
    const browse = chooseEncounterOption(state, getEncounterNode(state, context)!, "browse").state;
    const result = chooseEncounterOption(browse, getEncounterNode(browse, context)!, "add");
    expect(result.effect).toEqual({ type: "add-to-bag", productId: undefined });
    expect(getEncounterNode(result.state, context)?.text).toBe("Fine choice! Ember is tucked into your bag.");

    const bag = applyEncounterAction(result.state, { type: "open-bag" }).state;
    expect(bag.location).toBe("bag");
    expect(getEncounterNode(bag, context)?.text).toBe("Your bag is empty. Browse the companions?");
    expect(chooseEncounterOption(bag, getEncounterNode(bag, context)!, "explore").state.location).toBeNull();
  });
});
