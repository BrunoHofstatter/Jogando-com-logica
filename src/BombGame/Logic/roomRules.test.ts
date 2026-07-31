import { describe, expect, it } from "vitest";
import { assignBombRoles, updateReplayVotes } from "./roomRules";

describe("Bomb Game room rules", () => {
  it("honors different role preferences", () => {
    expect(assignBombRoles("bomb", "manual")).toEqual(["bomb", "manual"]);
    expect(assignBombRoles("manual", "bomb")).toEqual(["manual", "bomb"]);
  });

  it("resolves matching preferences with a fair random branch", () => {
    expect(assignBombRoles("bomb", "bomb", () => 0.1)).toEqual(["bomb", "manual"]);
    expect(assignBombRoles("bomb", "bomb", () => 0.9)).toEqual(["manual", "bomb"]);
  });

  it("supports authoritative replay vote cancellation", () => {
    expect(updateReplayVotes([], 0, true)).toEqual([0]);
    expect(updateReplayVotes([0], 1, true)).toEqual([0, 1]);
    expect(updateReplayVotes([0, 1], 0, false)).toEqual([1]);
  });
});
