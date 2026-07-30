import { describe, expect, it } from "vitest";
import { applyLevel1Intent, createLevel1State } from "./level1";

describe("Bomb Game level 1", () => {
  it("keeps generated values and ordering numbers inside their bands", () => {
    const state = createLevel1State(() => 0.5);
    expect(state.values.A).toBeGreaterThanOrEqual(2);
    expect(state.values.A).toBeLessThanOrEqual(7);
    expect(state.values.D).toBeGreaterThanOrEqual(11);
    expect(state.values.D).toBeLessThanOrEqual(14);
    expect([...state.orderingNumbers].sort((a, b) => a - b)).toHaveLength(7);
  });

  it("keeps correct ordering progress after a mistake", () => {
    const state = createLevel1State(() => 0.5);
    const sorted = [...state.orderingNumbers].sort((a, b) => a - b);
    applyLevel1Intent(state, { type: "select_ordering_number", value: sorted[0] });
    const result = applyLevel1Intent(state, { type: "select_ordering_number", value: sorted[2] });
    expect(result.mistake).toBe(true);
    expect(state.orderingProgress).toEqual([sorted[0]]);
  });

  it("uses plus, minus, minus as the operator solutions", () => {
    const state = createLevel1State(() => 0.5);
    expect(applyLevel1Intent(state, { type: "select_operator", row: 0, value: "+" }).mistake).toBe(false);
    expect(applyLevel1Intent(state, { type: "select_operator", row: 1, value: "-" }).mistake).toBe(false);
    expect(applyLevel1Intent(state, { type: "select_operator", row: 2, value: "*" }).mistake).toBe(true);
  });

  it("never creates zero or negative operands in manual calculations", () => {
    for (let index = 0; index < 100; index += 1) {
      const state = createLevel1State();
      state.manualCalculations.forEach(({ expression }) => {
        const operands = expression.match(/\d+/g)?.map(Number) ?? [];
        expect(operands.every((operand) => operand > 0)).toBe(true);
      });
    }
  });
});
