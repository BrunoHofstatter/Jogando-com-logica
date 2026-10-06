import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CrownChaseTutorialController } from "./CrownChaseTutorialController";
import { at, bluePiece, CROWN_TUTORIAL, initialPracticeState, objectiveMove, perform, practiceState, supportSetup } from "./lesson";
import { getLegalActionsForPiece, createInitialState } from "../Logic/v2";
import { readTutorialHistory } from "../../Shared/Tutorial/tutorialHistory";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const begin = (reduced = false) => {
  const controller = new CrownChaseTutorialController(() => reduced);
  controller.start();
  return controller;
};
function solve(controller: CrownChaseTutorialController) {
  const s = controller.getSnapshot();
  const objective = objectiveMove(s.stage, s.board);
  const from = bluePiece(s.board);
  const move = objective ?? getLegalActionsForPiece(s.board, from, 1)[0];
  controller.attempt(move);
  vi.runAllTimers();
}
function kingStage(controller: CrownChaseTutorialController) {
  for (let i = 0; i < 4; i++) solve(controller);
  expect(controller.getSnapshot()).toMatchObject({ stage: 5, phase: "kings" });
  controller.continue();
}

it("starts immediately with just a centered Ninja and all eight choices", () => {
  const c = begin();
  expect(c.getSnapshot()).toMatchObject({ stage: 1, phase: "active" });
  expect(getLegalActionsForPiece(c.getSnapshot().board, at(2, 2))).toHaveLength(8);
  expect(c.getSnapshot().board.board.flat().filter(Boolean)).toHaveLength(1);
});

it("every Ninja first move and every jumper first move can complete the lesson", () => {
  const ninjaActions = getLegalActionsForPiece(initialPracticeState(), at(2, 2));
  for (const first of ninjaActions) for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const c = begin();
    c.attempt(first); vi.runAllTimers();
    expect(c.getSnapshot().board.board[first.to.row - 1][first.to.col + 1]).toEqual({ type: "killer", owner: 0 });
    solve(c);
    expect(c.getSnapshot().stage).toBe(3);
    c.attempt({ from: at(2, 2), to: at(2 + dr, 2 + dc) }); vi.runAllTimers();
    const before = c.getSnapshot().board;
    const middle = objectiveMove(2, before)!.to;
    c.attempt(objectiveMove(4, before)!);
    vi.advanceTimersByTime(350);
    expect(c.getSnapshot()).toMatchObject({ stage: 4, phase: "observation" });
    expect(c.getSnapshot().board.board[middle.row][middle.col]).toEqual({ type: "jumper", owner: 0 });
    vi.advanceTimersByTime(2999);
    expect(c.getSnapshot().stage).toBe(4);
    vi.advanceTimersByTime(1);
    expect(c.getSnapshot()).toMatchObject({ stage: 5, phase: "kings" });
    c.continue(); solve(c);
    expect(c.getSnapshot()).toMatchObject({ stage: 7, phase: "completed" });
    expect(c.getSnapshot().board).toEqual(createInitialState());
  }
  expect(readTutorialHistory(CROWN_TUTORIAL).completed).toBe(true);
});

it.each([2, 4] as const)("support setup always has a legal objective at every board square in stage %s", stage => {
  for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
    const source = practiceState([{ ...at(row, col), type: stage === 2 ? "killer" : "jumper", owner: 1 }]);
    const setup = supportSetup(source, stage);
    const intent = objectiveMove(stage, setup.state)!;
    expect(perform(setup.state, intent)).not.toBeNull();
    expect(setup.state.board.flat().filter(Boolean)).toHaveLength(2);
    if (stage === 4) expect(setup.state.board[intent.to.row][intent.to.col]).toBeNull();
  }
});

it("other legal capture-exercise moves continue and never auto-complete after six attempts", () => {
  const c = begin(); solve(c);
  for (let i = 0; i < 8; i++) {
    const s = c.getSnapshot(), from = bluePiece(s.board);
    const alternative = getLegalActionsForPiece(s.board, from, 1).find(move => move.type === "move")!;
    c.attempt(alternative); vi.runAllTimers();
    expect(c.getSnapshot()).toMatchObject({ stage: 2, phase: "active" });
    expect(bluePiece(c.getSnapshot().board)).toEqual(alternative.to);
    expect(perform(c.getSnapshot().board, objectiveMove(2, c.getSnapshot().board)!)).not.toBeNull();
  }
  expect(c.getSnapshot().guidance).toBe(3);
  solve(c); expect(c.getSnapshot().stage).toBe(3);
});

it("other legal jumping-exercise moves keep a jump available without rollback", () => {
  const c = begin(); solve(c); solve(c); solve(c);
  for (let i = 0; i < 6; i++) {
    const s = c.getSnapshot();
    const move = getLegalActionsForPiece(s.board, bluePiece(s.board), 1).find(a => Math.abs(a.from.row - a.to.row) + Math.abs(a.from.col - a.to.col) === 1)!;
    c.attempt(move); vi.runAllTimers();
    expect(c.getSnapshot()).toMatchObject({ stage: 4, phase: "active" });
    expect(bluePiece(c.getSnapshot().board)).toEqual(move.to);
    expect(perform(c.getSnapshot().board, objectiveMove(4, c.getSnapshot().board)!)).not.toBeNull();
  }
});

it("the king exercise previews a legal alternative, then automatically returns and re-enables input", () => {
  const c = begin(); kingStage(c);
  const canonical = c.getSnapshot().board;
  const alternative = { from: at(0, 2), to: at(1, 2) };
  c.attempt(alternative);
  expect(c.getSnapshot()).toMatchObject({ phase: "feedback", feedback: "Tente capturar o rei vermelho." });
  expect(bluePiece(c.getSnapshot().board)).toEqual(at(1, 2));
  c.attempt(alternative); // Locked input must not add a second attempt.
  expect(c.getSnapshot().attempts).toBe(1);
  vi.advanceTimersByTime(1999);
  expect(c.getSnapshot().phase).toBe("feedback");
  vi.advanceTimersByTime(1);
  expect(c.getSnapshot()).toMatchObject({ phase: "returning", board: canonical, movement: { from: at(1, 2), to: at(0, 2) } });
  vi.advanceTimersByTime(350);
  expect(c.getSnapshot()).toMatchObject({ phase: "active", board: canonical });
});

it("illegal king-exercise landings never remove the Ninja and escalate on attempts two and three", () => {
  const c = begin(); kingStage(c);
  const canonical = c.getSnapshot().board;
  for (let i = 1; i <= 3; i++) {
    c.attempt({ from: at(0, 2), to: at(0, 3) });
    expect(c.getSnapshot().feedback).toBe("O Saltador só captura o rei.");
    expect(c.getSnapshot().board).toBe(canonical);
    vi.runAllTimers();
    expect(c.getSnapshot().guidance).toBe(i === 1 ? 0 : i);
  }
  solve(c);
  expect(c.getSnapshot().phase).toBe("completed");
});

it("hidden time never consumes the three-second observation", () => {
  const c = begin(); solve(c); solve(c); solve(c);
  c.attempt(objectiveMove(4, c.getSnapshot().board)!);
  vi.advanceTimersByTime(1350); // 350 movement + 1000 reading.
  c.setVisible(false); vi.advanceTimersByTime(30000);
  expect(c.getSnapshot().phase).toBe("observation");
  c.setVisible(true); vi.advanceTimersByTime(1999);
  expect(c.getSnapshot().stage).toBe(4);
  vi.advanceTimersByTime(1); expect(c.getSnapshot().stage).toBe(5);
});

it.each(["skip", "dispose", "start"] as const)("%s invalidates automatic feedback and hidden waits", command => {
  const c = begin();
  c.attempt({ from: at(2, 2), to: at(0, 0) });
  c.setVisible(false); c[command]();
  const snapshot = c.getSnapshot();
  c.setVisible(true); vi.runAllTimers();
  expect(c.getSnapshot()).toBe(snapshot);
  expect(vi.getTimerCount()).toBe(0);
});

it("replay retains completion history and resets all guidance", () => {
  const c = begin(true); kingStage(c); solve(c);
  c.start(); expect(c.getSnapshot()).toMatchObject({ stage: 1, phase: "active", guidance: 0, attempts: 0 });
  expect(c.getSnapshot().board).toEqual(initialPracticeState());
  c.skip(); expect(readTutorialHistory(CROWN_TUTORIAL).completed).toBe(true);
});

it("neutral selection does not count as an attempt", () => {
  const c = begin();
  c.selection(at(0, 0));
  expect(c.getSnapshot().attempts).toBe(0);
  expect(c.getSnapshot().phase).toBe("active");
});
