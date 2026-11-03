import { describe, expect, it } from "vitest";
import { matchCampQuestion } from "./campGuide";

describe("Camp guide FAQ", () => {
  it("explains that checkout takes no payment and delivers nothing", () => {
    expect(matchCampQuestion("How does checkout work?").replies).toEqual([
      { kind: "message", text: "Checkout is a demo: no payment is taken and nothing is delivered." },
    ]);
  });

  it("answers shipping questions truthfully", () => {
    expect(matchCampQuestion("Is shipping real?").replies[0]).toEqual({
      kind: "message",
      text: "This is a fictional demo village — nothing ships, and no payment is taken.",
    });
  });

  it("uses mood words to recommend a companion", () => {
    expect(matchCampQuestion("Which bold companion suits me?").replies).toEqual([
      { kind: "message", text: "Ember could be a good fit for your desk." },
      { kind: "product", productId: "ember", title: "Ember", url: "/products/ember" },
    ]);
  });

  it("uses the Oracle and a deterministic fallback for unknown questions", () => {
    expect(matchCampQuestion("Which companion suits me?").replies[0]).toEqual({
      kind: "message",
      text: "The Oracle can help match a companion to your desk mood.",
    });
    expect(matchCampQuestion("What is the moon made of?").replies[0]).toEqual({
      kind: "message",
      text: "I only know village matters — companions, checkout and the Oracle.",
    });
  });
});
