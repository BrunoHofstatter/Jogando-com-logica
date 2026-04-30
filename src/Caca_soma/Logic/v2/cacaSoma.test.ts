import { describe, expect, it } from "vitest";

import {
  applyPlayerAction,
  createInitialState,
  createPointsRaceConfig,
  expireRound,
  generateRoundTargets,
} from "./index";

function createSequentialBoard(max: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index % max) + 1);
}

describe("Caca Soma v2 match engine", () => {
  it("builds the agreed presets for 2v2 and 1v1", () => {
    const twoVersusTwo = createPointsRaceConfig({
      difficultyId: "medium",
      targetScore: 3,
      teamSize: 2,
    });
    const oneVersusOne = createPointsRaceConfig({
      difficultyId: "hard",
      targetScore: 3,
      teamSize: 1,
    });

    expect(twoVersusTwo.difficulty.boardSize).toBe(7);
    expect(twoVersusTwo.difficulty.maxCellValue).toBe(50);
    expect(twoVersusTwo.requiredSelections).toBe(2);
    expect(twoVersusTwo.selectionLimits).toEqual([1, 1]);

    expect(oneVersusOne.difficulty.boardSize).toBe(10);
    expect(oneVersusOne.difficulty.maxCellValue).toBe(120);
    expect(oneVersusOne.requiredSelections).toBe(3);
    expect(oneVersusOne.selectionLimits).toEqual([3]);
  });

  it("starts with a shared target when both boards can solve the same number", () => {
    const config = createPointsRaceConfig({
      difficultyId: "easy",
      targetScore: 3,
      teamSize: 2,
    });
    const boardValues = createSequentialBoard(30, 25);

    const state = createInitialState(config, 0, () => 0, boardValues);

    expect(state.status).toBe("playing");
    expect(state.boardValues).toEqual(boardValues);
    expect(state.currentRound?.targetNumbers).toEqual([3, 3]);
    expect(state.currentRound?.targetStrategy).toBe("shared");
  });

  it("falls back to different targets when the remaining boards no longer intersect", () => {
    const config = createPointsRaceConfig({
      difficultyId: "easy",
      targetScore: 3,
      teamSize: 2,
    });
    const boardValues = createSequentialBoard(30, 25);
    const state = createInitialState(config, 0, () => 0, boardValues);
    const teamAFreeCells = new Set([0, 1]);
    const teamBFreeCells = new Set([23, 24]);
    const teamALocked = Array.from({ length: 25 }, (_, cellId) => cellId).filter(
      (cellId) => !teamAFreeCells.has(cellId),
    );
    const teamBLocked = Array.from({ length: 25 }, (_, cellId) => cellId).filter(
      (cellId) => !teamBFreeCells.has(cellId),
    );

    const targets = generateRoundTargets(
      [
        { ...state.teams[0], lockedCellIds: teamALocked },
        { ...state.teams[1], lockedCellIds: teamBLocked },
      ],
      config,
      boardValues,
      () => 0,
    );

    expect(targets).toEqual({
      targetNumbers: [boardValues[0] + boardValues[1], boardValues[23] + boardValues[24]],
      targetStrategy: "fallback_distinct",
    });
  });

  it("submits teams through ready states, scores the faster correct team, and locks only correct cells", () => {
    const config = createPointsRaceConfig({
      difficultyId: "easy",
      targetScore: 1,
      teamSize: 2,
      selectionChangeCooldownMs: 0,
    });
    const boardValues = createSequentialBoard(30, 25);

    let state = createInitialState(config, 0, () => 0, boardValues);

    const actions = [
      { type: "set_player_selection", team: 0 as const, playerIndex: 0, cellIds: [0], nowMs: 100 },
      { type: "set_player_selection", team: 0 as const, playerIndex: 1, cellIds: [1], nowMs: 200 },
      { type: "set_player_ready", team: 0 as const, playerIndex: 0, ready: true, nowMs: 300 },
      { type: "set_player_ready", team: 0 as const, playerIndex: 1, ready: true, nowMs: 400 },
      { type: "set_player_selection", team: 1 as const, playerIndex: 0, cellIds: [0], nowMs: 500 },
      { type: "set_player_selection", team: 1 as const, playerIndex: 1, cellIds: [2], nowMs: 600 },
      { type: "set_player_ready", team: 1 as const, playerIndex: 0, ready: true, nowMs: 700 },
      { type: "set_player_ready", team: 1 as const, playerIndex: 1, ready: true, nowMs: 900 },
    ] as const;

    for (const action of actions) {
      const result = applyPlayerAction(state, action, () => 0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        state = result.state;
      }
    }

    expect(state.status).toBe("ended");
    expect(state.winner).toBe(0);
    expect(state.endReason).toBe("target_score");
    expect(state.teams[0].score).toBe(1);
    expect(state.teams[1].score).toBe(0);
    expect(state.teams[0].lockedCellIds).toEqual([0, 1]);
    expect(state.teams[1].lockedCellIds).toEqual([]);
    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toMatchObject({
      winner: 0,
      reason: "one_correct",
    });
  });

  it("enforces the selection cooldown before a player can change their pick again", () => {
    const config = createPointsRaceConfig({
      difficultyId: "easy",
      targetScore: 3,
      teamSize: 2,
      selectionChangeCooldownMs: 1_000,
    });

    let state = createInitialState(config, 0, () => 0, createSequentialBoard(30, 25));

    const firstPick = applyPlayerAction(state, {
      type: "set_player_selection",
      team: 0,
      playerIndex: 0,
      cellIds: [0],
      nowMs: 100,
    });
    expect(firstPick.ok).toBe(true);
    if (firstPick.ok) {
      state = firstPick.state;
    }

    const tooSoon = applyPlayerAction(state, {
      type: "set_player_selection",
      team: 0,
      playerIndex: 0,
      cellIds: [1],
      nowMs: 500,
    });

    expect(tooSoon).toEqual({
      ok: false,
      reason: "cooldown_active",
      remainingCooldownMs: 600,
    });
  });

  it("resolves an expired round with no point when nobody submits a correct answer", () => {
    const config = createPointsRaceConfig({
      difficultyId: "easy",
      targetScore: 2,
      teamSize: 2,
    });

    const initialState = createInitialState(config, 0, () => 0, createSequentialBoard(30, 25));
    const expired = expireRound(initialState, 60_000, () => 0);

    expect(expired.changed).toBe(true);
    expect(expired.state.status).toBe("playing");
    expect(expired.state.teams[0].score).toBe(0);
    expect(expired.state.teams[1].score).toBe(0);
    expect(expired.state.history).toHaveLength(1);
    expect(expired.state.history[0]).toMatchObject({
      winner: null,
      reason: "no_correct",
    });
    expect(expired.state.currentRound?.number).toBe(2);
  });
});
