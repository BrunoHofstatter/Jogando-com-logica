import { describe, expect, it } from "vitest";
import { applyLevel1Intent, createLevel1State, type Level1Intent } from "./level1";
import { applyBombLevelIntent } from "./levels";
import { projectBombLevel } from "./levelViews";
import type { SharedViewState } from "./multiplayer/protocol";

function rng(seed: number) { let state = seed; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }
const shared: SharedViewState = { roundId: "test", phase: "playing", lives: 3, hintsEnabled: true, countdownEndsAt: null, timerEndsAt: 180000, replayCountdownEndsAt: null, replayVotes: [], completedSections: [], eventId: 0, mistake: null, resultReason: null };

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

  it("uses the generated operator solutions and never accepts multiplication", () => {
    const state = createLevel1State(() => 0.5);
    expect(applyLevel1Intent(state, { type: "select_operator", row: 0, value: state.operatorSolutions[0] }).mistake).toBe(false);
    expect(applyLevel1Intent(state, { type: "select_operator", row: 1, value: state.operatorSolutions[1] }).mistake).toBe(false);
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

it("generates valid calculations, banded numbers, all four operator sets and all shuffled orders", () => {
  const patterns = new Set<string>();
  const counts = [0, 0, 0, 0];
  for (let seed = 1; seed <= 600; seed += 1) {
    const state = createLevel1State(rng(seed * 997));
    const ranges = { A: [2, 7], B: [5, 10], C: [1, 5], D: [11, 14] };
    for (const { letter, expression } of state.manualCalculations) {
      const [left, operator, right] = expression.split(" ");
      expect(Number(left)).toBeGreaterThan(0); expect(Number(right)).toBeGreaterThan(0);
      expect(operator === "+" ? Number(left) + Number(right) : Number(left) - Number(right)).toBe(state.values[letter]);
      expect(state.values[letter]).toBeGreaterThanOrEqual(ranges[letter][0]);
      expect(state.values[letter]).toBeLessThanOrEqual(ranges[letter][1]);
    }
    expect(new Set(state.orderingNumbers).size).toBe(7);
    const bands = [[3, 15], [16, 30], [31, 50], [51, 75], [76, 100], [101, 130], [131, 160]];
    [...state.orderingNumbers].sort((a, b) => a - b).forEach((n, i) => {
      expect(n).toBeGreaterThanOrEqual(bands[i][0]); expect(n).toBeLessThanOrEqual(bands[i][1]);
    });
    patterns.add(state.operatorSolutions.join(""));
    counts[state.operatorSolutions.filter((op) => op === "+").length] += 1;
    const bomb = projectBombLevel({ id: 1, state }, "bomb", shared);
    const manual = projectBombLevel({ id: 1, state }, "manual", shared);
    for (const key of ["values", "operatorSolutions", "calculations"]) expect(bomb).not.toHaveProperty(key);
    for (const key of ["orderingNumbers", "operatorEquations", "operatorSolutions"]) expect(manual).not.toHaveProperty(key);
    if (bomb.levelId !== 1 || bomb.role !== "bomb") throw new Error("Wrong projection");
    (["A", "C", "D"] as const).forEach((letter, row) => {
      const equation = bomb.operatorEquations[row];
      expect(equation.left).toBe(letter);
      const left = state.values[letter], right = Number(equation.right);
      expect(Number.isInteger(right)).toBe(true); expect(right).toBeGreaterThan(0);
      // Even knowing the documented ranges must not disclose the sign.
      const possibleAdditionValue = equation.result - right;
      const possibleSubtractionValue = equation.result + right;
      for (const possibleValue of [possibleAdditionValue, possibleSubtractionValue]) {
        expect(possibleValue).toBeGreaterThanOrEqual(ranges[letter][0]);
        expect(possibleValue).toBeLessThanOrEqual(ranges[letter][1]);
        expect(possibleValue * right).not.toBe(equation.result);
      }
      const possibilities = [left + right, left - right, left * right];
      expect(possibilities.filter((n) => n === bomb.operatorEquations[row].result)).toHaveLength(1);
      expect(bomb.operatorEquations[row].result).not.toBe(left * right);
      expect(bomb.operatorEquations[row].result).toBeGreaterThan(0);
      expect(applyLevel1Intent(state, { type: "select_operator", row: row as 0 | 1 | 2, value: state.operatorSolutions[row] }).mistake).toBe(false);
    });
  }
  expect(patterns.size).toBe(8);
  // Broad bounds catch choosing independent operators rather than uniform sets.
  counts.forEach((count) => { expect(count).toBeGreaterThan(100); expect(count).toBeLessThan(200); });
});

it.each([[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]])("wins in module order %s, %s, %s and locks solved answers", (...order) => {
  const state = createLevel1State(() => 0.5);
  const intents: Record<number, Level1Intent[]> = {
    1: [...state.orderingNumbers].sort((a, b) => a - b).map((value) => ({ type: "select_ordering_number", value })),
    2: [state.values.A + state.values.B, state.values.B - state.values.C, state.values.C + state.values.A].map((value, row) => ({ type: "submit_numeric_answer", row: row as 0 | 1 | 2, value })),
    3: state.operatorSolutions.map((value, row) => ({ type: "select_operator", row: row as 0 | 1 | 2, value })),
  };
  let completed = false;
  for (const section of order) for (const intent of intents[section]) {
    const result = applyLevel1Intent(state, intent);
    expect(result.accepted).toBe(true); expect(result.mistake).toBe(false); completed = result.completed;
    expect(applyLevel1Intent(state, intent).accepted).toBe(false);
  }
  expect(completed).toBe(true); expect(state.completedSections).toEqual(order);
});

it("preserves progress and rejects stale ordering revisions without another mistake", () => {
  const state = createLevel1State(() => 0.5);
  const sorted = [...state.orderingNumbers].sort((a, b) => a - b);
  applyLevel1Intent(state, { type: "select_ordering_number", value: sorted[0], revision: 0 });
  const wrong: Level1Intent = { type: "select_ordering_number", value: sorted[2], revision: 1 };
  expect(applyLevel1Intent(state, wrong).mistake).toBe(true);
  const before = structuredClone(state);
  expect(applyLevel1Intent(state, wrong).accepted).toBe(false);
  expect(state).toEqual(before); expect(state.orderingProgress).toEqual([sorted[0]]);
});

it("accepts zero, identifies numeric mistakes, and rejects malformed or wrong-role intents", () => {
  const state = createLevel1State(() => 0.5);
  state.values.B = 5; state.values.C = 5;
  const level = { id: 1 as const, state };
  for (const intent of [null, {}, { type: "submit_numeric_answer", row: 3, value: 0 }, { type: "submit_numeric_answer", row: 0, value: "7" }]) expect(applyBombLevelIntent(level, "bomb", intent).accepted).toBe(false);
  expect(applyBombLevelIntent(level, "manual", { type: "submit_numeric_answer", row: 1, value: 0 }).accepted).toBe(false);
  expect(applyLevel1Intent(state, { type: "submit_numeric_answer", row: 0, value: 999 }).mistake).toBe(true);
  expect(state.lastMistake).toEqual({ section: 2, row: 0, value: null });
  expect(applyLevel1Intent(state, { type: "submit_numeric_answer", row: 1, value: 0 }).mistake).toBe(false);
  expect(state.numericAnswers[1]).toBe(0);
});
