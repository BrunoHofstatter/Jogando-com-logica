import { describe, expect, it } from "vitest";

import {
  advanceRoundPhase,
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
    const easy = createPointsRaceConfig({
      difficultyId: "easy",
      targetScore: 3,
      teamSize: 2,
    });
    const oneVersusOne = createPointsRaceConfig({
      difficultyId: "hard",
      targetScore: 3,
      teamSize: 1,
    });

    expect(easy.difficulty.boardSize).toBe(5);
    expect(easy.difficulty.maxCellValue).toBe(25);
    expect(easy.difficulty.targetRange).toEqual({ min: 5, max: 35 });

    expect(twoVersusTwo.difficulty.boardSize).toBe(7);
    expect(twoVersusTwo.difficulty.maxCellValue).toBe(49);
    expect(twoVersusTwo.difficulty.targetRange).toEqual({ min: 10, max: 70 });
    expect(twoVersusTwo.requiredSelections).toBe(2);
    expect(twoVersusTwo.allowedSelectionCounts).toEqual([2]);
    expect(twoVersusTwo.selectionLimits).toEqual([1, 1]);
    expect(twoVersusTwo.selectionChangeCooldownMs).toBe(1_000);
    expect(twoVersusTwo.roundCountdownMs).toBe(5_000);
    expect(twoVersusTwo.targetRollMs).toBe(1_500);

    expect(oneVersusOne.difficulty.boardSize).toBe(10);
    expect(oneVersusOne.difficulty.maxCellValue).toBe(100);
    expect(oneVersusOne.difficulty.targetRange).toEqual({ min: 20, max: 150 });
    expect(oneVersusOne.requiredSelections).toBe(3);
    expect(oneVersusOne.allowedSelectionCounts).toEqual([2, 3]);
    expect(oneVersusOne.selectionLimits).toEqual([3]);
    expect(oneVersusOne.selectionChangeCooldownMs).toBe(0);
    expect(oneVersusOne.roundCountdownMs).toBe(5_000);
    expect(oneVersusOne.targetRollMs).toBe(1_500);
  });

  it("creates ordered board values that match the board cell count", () => {
    const config = createPointsRaceConfig({
      difficultyId: "medium",
      targetScore: 3,
      teamSize: 2,
    });

    const state = createInitialState(config, 0, () => 0);

    expect(state.boardValues).toEqual(Array.from({ length: 49 }, (_, index) => index + 1));
    expect(state.boardValues).not.toContain(50);
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
    expect(state.currentRound?.targetNumbers).toEqual([5, 5]);
    expect(state.currentRound?.targetStrategy).toBe("shared");
    expect(state.currentRound).toMatchObject({
      phase: "countdown",
      phaseEndsAtMs: 5_000,
      playStartsAtMs: 6_500,
      startedAtMs: 6_500,
      deadlineAtMs: 66_500,
    });
  });

  it("blocks actions before play starts and advances round phases", () => {
    const config = createPointsRaceConfig({
      difficultyId: "easy",
      targetScore: 3,
      teamSize: 2,
      selectionChangeCooldownMs: 0,
    });
    let state = createInitialState(config, 0, () => 0, createSequentialBoard(30, 25));

    expect(applyPlayerAction(state, {
      type: "set_player_selection",
      team: 0,
      playerIndex: 0,
      cellIds: [0],
      nowMs: 100,
    })).toEqual({
      ok: false,
      reason: "round_not_playing",
    });

    const rolling = advanceRoundPhase(state, 5_000);
    expect(rolling.changed).toBe(true);
    expect(rolling.state.currentRound?.phase).toBe("rolling");
    expect(rolling.events).toEqual([
      expect.objectContaining({
        type: "round_phase_changed",
        phase: "rolling",
      }),
    ]);

    const playing = advanceRoundPhase(rolling.state, 6_500);
    expect(playing.changed).toBe(true);
    expect(playing.state.currentRound?.phase).toBe("playing");
    state = playing.state;

    const pick = applyPlayerAction(state, {
      type: "set_player_selection",
      team: 0,
      playerIndex: 0,
      cellIds: [0],
      nowMs: 6_600,
    });
    expect(pick.ok).toBe(true);
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
      roundCountdownMs: 0,
      targetRollMs: 0,
    });
    const boardValues = createSequentialBoard(30, 25);

    let state = createInitialState(config, 0, () => 0, boardValues);

    const actions = [
      { type: "set_player_selection", team: 0 as const, playerIndex: 0, cellIds: [0], nowMs: 100 },
      { type: "set_player_selection", team: 0 as const, playerIndex: 1, cellIds: [3], nowMs: 200 },
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
    expect(state.teams[0].lockedCellIds).toEqual([0, 3]);
    expect(state.teams[1].lockedCellIds).toEqual([]);
    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toMatchObject({
      winner: 0,
      reason: "one_correct",
    });
  });

  it("lets 1v1 players select multiple cells before readying", () => {
    const config = createPointsRaceConfig({
      difficultyId: "medium",
      targetScore: 1,
      teamSize: 1,
      selectionChangeCooldownMs: 0,
      roundCountdownMs: 0,
      targetRollMs: 0,
    });
    const boardValues = createSequentialBoard(50, 49);

    let state = createInitialState(config, 0, () => 0, boardValues);

    expect(state.currentRound?.targetNumbers).toEqual([10, 10]);

    const actions = [
      { type: "set_player_selection", team: 0 as const, playerIndex: 0, cellIds: [0, 1, 6], nowMs: 100 },
      { type: "set_player_ready", team: 0 as const, playerIndex: 0, ready: true, nowMs: 200 },
      { type: "set_player_selection", team: 1 as const, playerIndex: 0, cellIds: [0, 1, 3], nowMs: 300 },
      { type: "set_player_ready", team: 1 as const, playerIndex: 0, ready: true, nowMs: 400 },
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
    expect(state.teams[0].score).toBe(1);
    expect(state.teams[0].lockedCellIds).toEqual([0, 1, 6]);
    expect(state.teams[1].lockedCellIds).toEqual([]);
  });

  it("lets 1v1 medium and hard submit with two selected cells", () => {
    const config = createPointsRaceConfig({
      difficultyId: "hard",
      targetScore: 1,
      teamSize: 1,
      selectionChangeCooldownMs: 0,
      roundCountdownMs: 0,
      targetRollMs: 0,
    });
    const boardValues = createSequentialBoard(100, 100);

    let state = createInitialState(config, 0, () => 0, boardValues);
    expect(state.currentRound?.targetNumbers).toEqual([20, 20]);

    const actions = [
      { type: "set_player_selection", team: 0 as const, playerIndex: 0, cellIds: [0, 18], nowMs: 100 },
      { type: "set_player_ready", team: 0 as const, playerIndex: 0, ready: true, nowMs: 200 },
      { type: "set_player_selection", team: 1 as const, playerIndex: 0, cellIds: [0, 1], nowMs: 300 },
      { type: "set_player_ready", team: 1 as const, playerIndex: 0, ready: true, nowMs: 400 },
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
    expect(state.teams[0].lockedCellIds).toEqual([0, 18]);
  });

  it("enforces the selection cooldown before a player can change their pick again", () => {
    const config = createPointsRaceConfig({
      difficultyId: "easy",
      targetScore: 3,
      teamSize: 2,
      selectionChangeCooldownMs: 1_000,
      roundCountdownMs: 0,
      targetRollMs: 0,
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
      roundCountdownMs: 0,
      targetRollMs: 0,
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
