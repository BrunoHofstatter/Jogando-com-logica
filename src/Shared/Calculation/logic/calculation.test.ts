import { describe, expect, it } from "vitest";
import { buildAdditionPlan } from "./addition";
import { buildMultiplicationPlan } from "./multiplication";
import { buildSubtractionPlan } from "./subtraction";

describe("calculation plans", () => {
  it("builds multiplication with carry after the result digit", () => {
    const plan = buildMultiplicationPlan(36, 6, 3);

    expect(plan.expectedAnswer).toBe(216);
    expect(plan.answerDigits).toEqual([" ", "2", "1", "6"]);
    expect(plan.steps.map((step) => [step.cellId, step.expected])).toEqual([
      ["answer-3", "6"],
      ["carry-2", "3"],
      ["answer-2", "1"],
      ["answer-1", "2"],
    ]);
  });

  it("builds multiplication for Rubik's Class totals", () => {
    expect(buildMultiplicationPlan(9, 6, 3).expectedAnswer).toBe(54);
    expect(buildMultiplicationPlan(16, 6, 3).expectedAnswer).toBe(96);
    expect(buildMultiplicationPlan(25, 6, 3).expectedAnswer).toBe(150);
    expect(buildMultiplicationPlan(36, 6, 3).expectedAnswer).toBe(216);
  });

  it("builds column-by-column guidance for Rubik's Class multiplication", () => {
    const plan = buildMultiplicationPlan(16, 6, 2);

    expect(plan.steps.map((step) => step.cellId)).toEqual([
      "answer-2",
      "carry-1",
      "answer-1",
    ]);
    expect(plan.steps[0].guidance).toMatchObject({
      equationPrefix: "6 × 6 =",
      leadingDigit: "3",
      resultDigit: "6",
      leadingDestination: "carry",
    });
    expect(plan.steps[1].guidance?.detail).toContain("pequena caixa");
    expect(plan.steps[2].guidance).toMatchObject({
      equationPrefix: "6 × 1 + 3 =",
      resultDigit: "9",
    });
  });

  it("keeps full guidance available when the final product has two digits", () => {
    const plan = buildMultiplicationPlan(25, 6, 2);
    const finalLeadingStep = plan.steps[plan.steps.length - 1];

    expect(finalLeadingStep).toMatchObject({
      cellId: "answer-0",
      expected: "1",
      guidance: {
        equationPrefix: "6 × 2 + 3 =",
        leadingDigit: "1",
        resultDigit: "5",
        leadingDestination: "answer",
      },
    });
  });

  it("builds addition with multiple rows and carry", () => {
    const plan = buildAdditionPlan([25, 36, 14], 3);

    expect(plan.expectedAnswer).toBe(75);
    expect(plan.answerDigits).toEqual([" ", " ", "7", "5"]);
    expect(plan.steps.map((step) => [step.cellId, step.expected])).toEqual([
      ["answer-3", "5"],
      ["carry-2", "1"],
      ["answer-2", "7"],
    ]);
  });

  it("builds subtraction with borrow replacement cells", () => {
    const plan = buildSubtractionPlan(52, 18, 2);

    expect(plan.expectedAnswer).toBe(34);
    expect(plan.processCells.map((cell) => [cell.id, cell.expected])).toEqual([
      ["borrow-0", "4"],
      ["borrow-1", "12"],
    ]);
    expect(plan.steps.map((step) => [step.cellId, step.expected])).toEqual([
      ["borrow-0", "4"],
      ["borrow-1", "12"],
      ["answer-1", "4"],
      ["answer-0", "3"],
    ]);
  });

  it("builds subtraction through zeroes", () => {
    const plan = buildSubtractionPlan(102, 47, 3);

    expect(plan.expectedAnswer).toBe(55);
    expect(plan.processCells.map((cell) => [cell.id, cell.expected])).toEqual([
      ["borrow-0", "0"],
      ["borrow-1", "9"],
      ["borrow-2", "12"],
    ]);
    expect(plan.steps.map((step) => [step.cellId, step.expected])).toEqual([
      ["borrow-0", "0"],
      ["borrow-1", "9"],
      ["borrow-2", "12"],
      ["answer-2", "5"],
      ["answer-1", "5"],
    ]);
  });
});
