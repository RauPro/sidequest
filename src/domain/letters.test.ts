import { describe, expect, it } from "vitest";
import { parseLetterId } from "./letters";

describe("letter deep links", () => {
  it.each(["ember", "moss", "bolt", "welcome"])("accepts %s", (letter) => {
    expect(parseLetterId(letter)).toBe(letter);
  });

  it.each([null, "", "unknown", "EMBER"])("ignores %s", (letter) => {
    expect(parseLetterId(letter)).toBeNull();
  });
});
