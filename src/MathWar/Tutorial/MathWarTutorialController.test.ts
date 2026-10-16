import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MathWarTutorialController } from "./MathWarTutorialController";
import { at, costLabels, findPiece, firstFixture, fixture, huntHint, MATH_TUTORIAL, piece } from "./lesson";
import { evaluateMove, getLegalActionsForPiece, resolveMoveIntent } from "../Logic/v2";
import { readTutorialHistory } from "../../Shared/Tutorial/tutorialHistory";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const begin = () => { const c = new MathWarTutorialController(); c.start(); return c; };
const drain = () => vi.runAllTimers();
function move(c: MathWarTutorialController) {
  const s = c.getSnapshot();
  c.attempt(c.objective() ?? getLegalActionsForPiece(s.board, s.selected!, 1)[0]); drain();
}
function reachHunt(c: MathWarTutorialController, reveal = true) {
  move(c); move(c); c.continue(); drain(); move(c); c.continue(); move(c); c.continue(); drain();
  expect(c.getSnapshot()).toMatchObject({ stage: 5, phase: "updated" });
  c.continue(); if (reveal) drain();
}

it("preserves every legal first destination through the energy introduction", () => {
  for (const action of getLegalActionsForPiece(firstFixture(), at(3, 3), 1)) {
    const c = begin(); c.attempt(action); drain();
    expect(c.getSnapshot()).toMatchObject({ stage: 2, phase: "active", selected: action.to });
    expect(findPiece(c.getSnapshot().board, "blue")).toEqual(action.to);
    expect(c.getSnapshot().board.diceRoll).toEqual([2, 2]);
    move(c); expect(c.getSnapshot().phase).toBe("spent");
    drain(); expect(c.getSnapshot().stage).toBe(2);
    c.dispose();
  }
});

it("shows actual energy spent and waits for acknowledgement before the next piece", () => {
  const c = begin(); move(c);
  const from = c.getSnapshot().selected!;
  const action = getLegalActionsForPiece(c.getSnapshot().board, from, 1).find(a => a.cost.distance === 2)!;
  c.attempt(action); drain();
  expect(c.getSnapshot()).toMatchObject({ stage: 2, phase: "spent", spent: 4 });
  c.continue(); drain();
  expect(c.getSnapshot()).toMatchObject({ stage: 3, phase: "active" });
});

it("keeps every legal diagonal choice completable", () => {
  const setup = begin(); move(setup); move(setup); setup.continue(); drain();
  const actions = getLegalActionsForPiece(setup.getSnapshot().board, at(3, 3), 1); setup.dispose();
  for (const action of actions) {
    const c = begin(); move(c); move(c); c.continue(); drain();
    c.attempt(action); drain(); expect(c.getSnapshot()).toMatchObject({ stage: 3, phase: "spent", spent: action.cost.totalCost });
    c.continue(); expect(c.getSnapshot()).toMatchObject({ stage: 4, phase: "active" }); c.dispose();
  }
});

it("keeps one affordable and one unaffordable capture, with recovery for legal alternatives", () => {
  const c = begin(); move(c); move(c); c.continue(); drain(); move(c); c.continue();
  const board = c.getSnapshot().board;
  expect(evaluateMove(board, { from: at(3, 3), to: at(3, 5) }).isValid).toBe(true);
  expect(evaluateMove(board, { from: at(3, 3), to: at(0, 3) })).toMatchObject({ isValid: false, requiredEnergy: 8, availableEnergy: 6 });
  c.attempt({ from: at(3, 3), to: at(4, 3) });
  expect(c.getSnapshot()).toMatchObject({ phase: "feedback", feedback: "Capture a peça vermelha." });
  c.attempt({ from: at(4, 3), to: at(4, 4) }); expect(c.getSnapshot().attempts).toBe(1);
  drain(); expect(c.getSnapshot().board).toBe(board);
  move(c); expect(c.getSnapshot()).toMatchObject({ phase: "spent", spent: 6 });
});

it("demonstrates exactly three alternating turns and decreases dice from seven to three", () => {
  const c = begin(); move(c); move(c); c.continue(); drain(); move(c); c.continue(); move(c); c.continue();
  expect(c.getSnapshot()).toMatchObject({ stage: 5, phase: "demonstrating", board: { turnCount: 0, currentPlayer: 1, diceRoll: [3, 4] } });
  vi.advanceTimersByTime(2200);
  expect(c.getSnapshot().board).toMatchObject({ turnCount: 1, currentPlayer: 0, diceRoll: [3, 4] });
  vi.advanceTimersByTime(1650);
  expect(c.getSnapshot().board).toMatchObject({ turnCount: 2, currentPlayer: 1, diceRoll: [3, 4] });
  vi.advanceTimersByTime(1650);
  expect(c.getSnapshot().board).toMatchObject({ turnCount: 3, currentPlayer: 0, diceRoll: [1, 2] });
  drain(); expect(c.getSnapshot().phase).toBe("updated");
});

it("reveals the Captain before introducing the enemy and enabling the hunt", () => {
  const c = begin(); reachHunt(c, false);
  expect(c.getSnapshot()).toMatchObject({ stage: 6, phase: "introducing", captainVisible: false, enemyVisible: false });
  expect(c.getSnapshot().board.board.flat().filter(Boolean)).toHaveLength(10);
  vi.advanceTimersByTime(2400);
  expect(c.getSnapshot()).toMatchObject({ phase: "revealing", captainVisible: true, enemyVisible: false });
  vi.advanceTimersByTime(2000);
  expect(c.getSnapshot()).toMatchObject({ phase: "revealing", enemyVisible: true });
  vi.advanceTimersByTime(350); expect(c.getSnapshot().phase).toBe("active");
});

it("allows selecting another blue piece and retains legal hunt moves without progression or rerolls", () => {
  const c = begin(); reachHunt(c);
  c.select(at(6, 2));
  const action = getLegalActionsForPiece(c.getSnapshot().board, at(6, 2), 1)[0];
  c.attempt(action); drain();
  expect(c.getSnapshot()).toMatchObject({ stage: 6, phase: "active", selected: action.to, board: { currentPlayer: 1, diceRoll: [3, 4] } });
  expect(c.getSnapshot().board.board[action.to.row][action.to.col]?.owner).toBe(1);
  const hint = huntHint(c.getSnapshot().board, action.to)!;
  expect(resolveMoveIntent(c.getSnapshot().board, hint, 1)).not.toBeNull();
  c.select(at(7, 2));
  for (let i = 0; i < 2; i++) { c.attempt({ from: at(7, 2), to: at(5, 2) }); drain(); }
  expect(c.getSnapshot().guidance).toBe(2);
  expect(c.getSnapshot().selected).toEqual(c.objective()!.from);
  expect(resolveMoveIntent(c.getSnapshot().board, c.objective()!, 1)).not.toBeNull();
});

it("completes only after both Captain-cost actions, and replay retains history", () => {
  const c = begin(); reachHunt(c); move(c);
  expect(c.getSnapshot()).toMatchObject({ stage: 6, phase: "won" });
  c.continue();
  c.attempt({ from: at(3, 3), to: at(3, 5) }); drain();
  expect(c.getSnapshot()).toMatchObject({ stage: 7, phase: "active" });
  move(c); expect(c.getSnapshot()).toMatchObject({ phase: "spent", spent: 4 });
  c.continue(); move(c); expect(c.getSnapshot()).toMatchObject({ phase: "spent", spent: 8 });
  c.continue(); expect(c.getSnapshot()).toMatchObject({ stage: 8, phase: "completed" });
  expect(c.getSnapshot().board.board.flat().filter(Boolean)).toHaveLength(20);
  expect(readTutorialHistory(MATH_TUTORIAL).completed).toBe(true);
  c.start(); c.skip(); expect(readTutorialHistory(MATH_TUTORIAL).completed).toBe(true);
});

it("shows labels to the edge, stops at blockers, and prices captures using the moving piece", () => {
  const state = fixture([
    { position: at(3, 3), piece: piece("blue", 1, "sum", 2, true) },
    { position: at(3, 5), piece: piece("red", 0, "sum", 4) },
    { position: at(1, 3), piece: piece("ally", 1) },
  ]);
  const labels = costLabels(state, at(3, 3));
  expect(labels.find(l => l.position.row === 7 && l.position.col === 3)).toMatchObject({ cost: 16, affordable: false });
  expect(labels.find(l => l.position.row === 3 && l.position.col === 5)).toMatchObject({ cost: 12, capture: true, affordable: false });
  expect(labels.some(l => l.position.row === 3 && l.position.col > 5)).toBe(false);
  expect(labels.some(l => l.position.col === 3 && l.position.row <= 1)).toBe(false);
});

it("pauses introduction reading and prevents neutral selection from counting as a mistake", () => {
  const c = begin(); c.select(null); expect(c.getSnapshot().attempts).toBe(0); c.select(at(3, 3)); move(c);
  expect(c.getSnapshot().stage).toBe(2);
  c.start(); c.attempt({ from: at(3, 3), to: at(0, 0) }); vi.advanceTimersByTime(500);
  c.setVisible(false); vi.advanceTimersByTime(30000); expect(c.getSnapshot().phase).toBe("feedback");
  c.setVisible(true); vi.advanceTimersByTime(1499); expect(c.getSnapshot().phase).toBe("feedback");
  vi.advanceTimersByTime(1); expect(c.getSnapshot().phase).toBe("active");
});

it.each(["skip", "dispose", "start"] as const)("%s cancels dice, feedback, and Captain reveal callbacks", command => {
  for (const setup of [
    (c: MathWarTutorialController) => { c.attempt({ from: at(3, 3), to: at(0, 0) }); },
    (c: MathWarTutorialController) => { c.attempt({ from: at(3, 3), to: at(3, 4) }); vi.advanceTimersByTime(350); },
    (c: MathWarTutorialController) => { reachHunt(c, false); },
  ]) {
    const c = begin(); setup(c); c[command](); const snapshot = c.getSnapshot(); drain();
    expect(c.getSnapshot()).toBe(snapshot); expect(vi.getTimerCount()).toBe(0); c.dispose();
  }
});

it("reduced motion removes cosmetic waits while preserving explanation and acknowledgement", () => {
  const c = new MathWarTutorialController(() => true); c.start();
  c.attempt({ from: at(3, 3), to: at(3, 4) });
  vi.advanceTimersToNextTimer();
  vi.advanceTimersToNextTimer();
  expect(c.getSnapshot()).toMatchObject({ stage: 2, phase: "explaining" });
  vi.advanceTimersByTime(1799); expect(c.getSnapshot().phase).toBe("explaining");
  vi.advanceTimersByTime(1); expect(c.getSnapshot().phase).toBe("active");
  c.attempt({ from: at(3, 4), to: at(3, 5) }); drain();
  expect(c.getSnapshot()).toMatchObject({ stage: 2, phase: "spent" });
  c.dispose();
});
