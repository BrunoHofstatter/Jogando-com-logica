import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MathWarTutorialController } from "./MathWarTutorialController";
import { at, costLabels, diagonalFixture, findPiece, firstFixture, fixture, huntHint, MATH_TUTORIAL, piece } from "./lesson";
import { evaluateMove, getLegalActionsForPiece, resolveMoveIntent } from "../Logic/v2";
import { readTutorialHistory } from "../../Shared/Tutorial/tutorialHistory";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const begin = () => { const c = new MathWarTutorialController(); c.start(); return c; };
const drain = () => vi.runAllTimers();
function move(c: MathWarTutorialController) {
  const s = c.getSnapshot(); c.attempt(c.objective() ?? getLegalActionsForPiece(s.board, s.selected!, 1)[0]); drain();
}
function reachCapture(c: MathWarTutorialController) { move(c); move(c); move(c); expect(c.getSnapshot().stage).toBe(4); }
function reachDemo(c: MathWarTutorialController) {
  reachCapture(c); c.attempt(c.objective()!); vi.advanceTimersByTime(3350);
  expect(c.getSnapshot()).toMatchObject({ stage: 5, phase: "rolling" });
}
function reachHunt(c: MathWarTutorialController, reveal = true) {
  reachDemo(c); vi.advanceTimersByTime(12250);
  expect(c.getSnapshot()).toMatchObject({ stage: 6, phase: "introducing" });
  if (reveal) drain();
}

it("allows every initial row/column destination through the edge and preserves it for energy", () => {
  const actions = getLegalActionsForPiece(firstFixture(), at(3, 3), 1);
  expect(actions).toHaveLength(14);
  for (const target of [at(0, 3), at(7, 3), at(3, 0), at(3, 7)]) expect(actions.some(a => a.to.row === target.row && a.to.col === target.col)).toBe(true);
  for (const action of actions) {
    const c = begin(); c.attempt(action); drain();
    expect(c.getSnapshot()).toMatchObject({ stage: 2, phase: "active", selected: action.to });
    expect(findPiece(c.getSnapshot().board, "blue")).toEqual(action.to);
    expect(c.getSnapshot().board.diceRoll).toEqual([2, 2]); c.dispose();
  }
});

it("shows energy spent for three visible seconds, then enters diagonals with the same dice and no roll", () => {
  const c = begin(); move(c);
  const action = getLegalActionsForPiece(c.getSnapshot().board, c.getSnapshot().selected!, 1).find(a => a.cost.distance === 2)!;
  c.attempt(action); vi.advanceTimersByTime(350);
  expect(c.getSnapshot()).toMatchObject({ stage: 2, phase: "spent", spent: 4 });
  c.setVisible(false); vi.advanceTimersByTime(10000); expect(c.getSnapshot().phase).toBe("spent"); c.setVisible(true);
  vi.advanceTimersByTime(2999); expect(c.getSnapshot().stage).toBe(2);
  vi.advanceTimersByTime(1);
  expect(c.getSnapshot()).toMatchObject({ stage: 3, phase: "active", board: { diceRoll: [2, 2] } });
});

it("keeps every legal diagonal choice completable with automatic progression", () => {
  for (const action of getLegalActionsForPiece(diagonalFixture(), at(3, 3), 1)) {
    const c = begin(); move(c); move(c); c.attempt(action); vi.advanceTimersByTime(350);
    expect(c.getSnapshot()).toMatchObject({ stage: 3, phase: "spent", spent: action.cost.totalCost });
    vi.advanceTimersByTime(3000); expect(c.getSnapshot()).toMatchObject({ stage: 4, phase: "active" }); c.dispose();
  }
});

it("keeps one affordable capture, restores legal alternatives, and gives short numeric feedback", () => {
  const c = begin(); reachCapture(c); const board = c.getSnapshot().board;
  expect(evaluateMove(board, { from: at(3, 3), to: at(3, 5) }).isValid).toBe(true);
  c.attempt({ from: at(3, 3), to: at(4, 3) });
  expect(c.getSnapshot()).toMatchObject({ phase: "feedback", feedback: "Capture a peça vermelha." });
  c.attempt({ from: at(4, 3), to: at(4, 4) }); expect(c.getSnapshot().attempts).toBe(1);
  drain(); expect(c.getSnapshot().board).toBe(board);
  c.attempt({ from: at(3, 3), to: at(0, 3) });
  expect(c.getSnapshot()).toMatchObject({ feedbackEnergy: { required: 8, available: 6 } }); drain();
  c.attempt(c.objective()!); vi.advanceTimersByTime(350); expect(c.getSnapshot()).toMatchObject({ phase: "spent", spent: 6 });
  c.dispose();
});

it("demonstrates red, blue, red with the next player selected between moves, then rolls three", () => {
  const c = begin(); reachDemo(c);
  expect(c.getSnapshot().board).toMatchObject({ turnCount: 0, currentPlayer: 0, diceRoll: [3, 4] });
  vi.advanceTimersByTime(800); expect(c.getSnapshot()).toMatchObject({ rollDisplay: 7, rollSettled: true });
  vi.advanceTimersByTime(2600); // Roll ends at 2200, then first move at 3400.
  expect(c.getSnapshot()).toMatchObject({ movement: { from: at(2, 5), to: at(3, 5) }, selected: at(3, 5) });
  vi.advanceTimersByTime(350);
  expect(c.getSnapshot()).toMatchObject({ selected: at(5, 2), board: { turnCount: 1, currentPlayer: 1 } });
  vi.advanceTimersByTime(1300);
  expect(c.getSnapshot().movement).toEqual({ from: at(5, 2), to: at(4, 2) });
  vi.advanceTimersByTime(350);
  expect(c.getSnapshot()).toMatchObject({ selected: at(3, 5), board: { turnCount: 2, currentPlayer: 0 } });
  vi.advanceTimersByTime(1300);
  expect(c.getSnapshot().movement).toEqual({ from: at(3, 5), to: at(3, 4) });
  vi.advanceTimersByTime(350); expect(c.getSnapshot()).toMatchObject({ phase: "rolling", selected: at(4, 2), board: { currentPlayer: 1, diceRoll: [1, 2] } });
  vi.advanceTimersByTime(800); expect(c.getSnapshot()).toMatchObject({ rollSettled: true, rollDisplay: 3 });
  vi.advanceTimersByTime(1400); expect(c.getSnapshot()).toMatchObject({ phase: "updated", selected: at(4, 2) });
  c.dispose();
});

it("waits four seconds to reveal the Captain, then two more for the enemy", () => {
  const c = begin(); reachHunt(c, false);
  expect(c.getSnapshot()).toMatchObject({ captainVisible: false, enemyVisible: false });
  expect(c.getSnapshot().board.board.flat().filter(Boolean)).toHaveLength(10);
  vi.advanceTimersByTime(3999); expect(c.getSnapshot().captainVisible).toBe(false);
  vi.advanceTimersByTime(1); expect(c.getSnapshot()).toMatchObject({ phase: "revealing", captainVisible: true, enemyVisible: false });
  vi.advanceTimersByTime(1999); expect(c.getSnapshot().enemyVisible).toBe(false);
  vi.advanceTimersByTime(1); expect(c.getSnapshot().enemyVisible).toBe(true);
  vi.advanceTimersByTime(350); expect(c.getSnapshot().phase).toBe("active");
});

it("retains hunt moves and selects a legal hint source after mistakes", () => {
  const c = begin(); reachHunt(c); c.select(at(6, 2));
  const action = getLegalActionsForPiece(c.getSnapshot().board, at(6, 2), 1)[0]; c.attempt(action); drain();
  expect(c.getSnapshot()).toMatchObject({ stage: 6, phase: "active", selected: action.to, board: { currentPlayer: 1, diceRoll: [3, 4] } });
  expect(resolveMoveIntent(c.getSnapshot().board, huntHint(c.getSnapshot().board, action.to)!, 1)).not.toBeNull();
  c.select(at(7, 2));
  for (let i = 0; i < 2; i++) { c.attempt({ from: at(7, 2), to: at(5, 2) }); drain(); }
  expect(c.getSnapshot().guidance).toBe(2); expect(c.getSnapshot().selected).toEqual(c.objective()!.from);
});

it("teaches Captain costs only through capture, completes automatically, and preserves replay history", () => {
  const c = begin(); reachHunt(c); c.attempt(c.objective()!); vi.advanceTimersByTime(350);
  expect(c.getSnapshot()).toMatchObject({ stage: 6, phase: "won" });
  vi.advanceTimersByTime(3000); expect(c.getSnapshot()).toMatchObject({ stage: 7, phase: "active" });
  expect(c.getSnapshot().board.board.flat().filter(Boolean)).toHaveLength(2);
  c.attempt({ from: at(3, 3), to: at(2, 3) }); drain();
  expect(c.getSnapshot()).toMatchObject({ stage: 7, phase: "active", feedback: "" });
  c.attempt(c.objective()!); vi.advanceTimersByTime(350); expect(c.getSnapshot()).toMatchObject({ phase: "spent", spent: 8 });
  vi.advanceTimersByTime(2999); expect(c.getSnapshot().stage).toBe(7);
  vi.advanceTimersByTime(1); expect(c.getSnapshot()).toMatchObject({ stage: 8, phase: "completed" });
  expect(readTutorialHistory(MATH_TUTORIAL).completed).toBe(true);
  c.start(); c.skip(); expect(readTutorialHistory(MATH_TUTORIAL).completed).toBe(true);
});

it("shows prices to the edge, stops at blockers, and uses the moving Captain's cost", () => {
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

it("uses a brief generic correction for illegal directions and pauses it while hidden", () => {
  const c = begin(); c.select(null); expect(c.getSnapshot().attempts).toBe(0); c.select(at(3, 3));
  c.attempt({ from: at(3, 3), to: at(0, 0) }); expect(c.getSnapshot().feedback).toBe("A peça não pode ir aí.");
  vi.advanceTimersByTime(500); c.setVisible(false); vi.advanceTimersByTime(30000); expect(c.getSnapshot().phase).toBe("feedback");
  c.setVisible(true); vi.advanceTimersByTime(1499); expect(c.getSnapshot().phase).toBe("feedback");
  vi.advanceTimersByTime(1); expect(c.getSnapshot().phase).toBe("active");
});

it.each(["skip", "dispose", "start"] as const)("%s cancels rolls, automatic advances, and Captain reveals", command => {
  for (const setup of [
    (c: MathWarTutorialController) => { c.attempt({ from: at(3, 3), to: at(0, 0) }); },
    (c: MathWarTutorialController) => { c.attempt({ from: at(3, 3), to: at(3, 4) }); vi.advanceTimersByTime(350); },
    (c: MathWarTutorialController) => { move(c); c.attempt(c.objective()!); vi.advanceTimersByTime(350); },
    (c: MathWarTutorialController) => { reachHunt(c, false); },
  ]) {
    const c = begin(); setup(c); c[command](); const snapshot = c.getSnapshot(); drain();
    expect(c.getSnapshot()).toBe(snapshot); expect(vi.getTimerCount()).toBe(0); c.dispose();
  }
});

it("reduced motion keeps the dice result and three-second reading windows", () => {
  const c = new MathWarTutorialController(() => true); c.start(); c.attempt({ from: at(3, 3), to: at(3, 4) });
  vi.advanceTimersToNextTimer(); vi.advanceTimersToNextTimer();
  expect(c.getSnapshot()).toMatchObject({ phase: "rolling", rollSettled: true, rollDisplay: 4 });
  drain(); c.attempt(c.objective()!); vi.advanceTimersToNextTimer();
  expect(c.getSnapshot()).toMatchObject({ stage: 2, phase: "spent" });
  vi.advanceTimersByTime(2999); expect(c.getSnapshot().stage).toBe(2);
  vi.advanceTimersByTime(1); expect(c.getSnapshot()).toMatchObject({ stage: 3, phase: "active" }); c.dispose();
});
