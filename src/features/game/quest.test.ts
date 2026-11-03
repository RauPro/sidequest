import { expect, it } from "vitest";
import {
  emptyQuestProgress,
  restoreQuestProgress,
  serializeQuestProgress,
} from "./quest";

it("restores only the supported versioned quest steps", () => {
  expect(restoreQuestProgress(null)).toEqual(emptyQuestProgress);
  expect(restoreQuestProgress("{broken")).toEqual(emptyQuestProgress);
  expect(restoreQuestProgress('{"version":2,"steps":{"market":true}}')).toEqual(emptyQuestProgress);
  expect(restoreQuestProgress('{"version":1,"steps":{"market":true,"oracle":"done","unknown":true}}')).toEqual({
    market: true,
    oracle: false,
    bag: false,
  });
});

it("serializes progress using the versioned quest key shape", () => {
  expect(serializeQuestProgress({ market: true, oracle: false, bag: true })).toBe(
    '{"version":1,"steps":{"market":true,"oracle":false,"bag":true}}',
  );
});
