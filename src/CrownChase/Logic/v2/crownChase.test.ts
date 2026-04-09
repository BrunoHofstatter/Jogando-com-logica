import { describe, expect, it } from "vitest";

import {
  applyAction,
  createInitialState,
  getLegalActions,
  getLegalActionsForPiece,
  getWinner,
  isGameOver,
  resolveMoveIntent,
  resolveTurnState,
} from "./crownChase";
import type {
  CrownChaseBoard,
  CrownChasePiece,
  CrownChaseState,
  PlayerId,
  Position,
} from "./types";

describe("Crown Chase v2 domain", () => {
  it("creates the agreed initial state with player 1 starting", () => {
    const state = createInitialState();

    expect(state.currentPlayer).toBe(1);
    expect(state.status).toBe("playing");
    expect(state.turnCount).toBe(0);
    expect(state.capturedByPlayer).toEqual([0, 0]);
    expect(getLegalActions(state)).not.toHaveLength(0);
  });

  it("keeps the king immobile", () => {
    const state = createInitialState();

    expect(getLegalActionsForPiece(state, { row: 4, col: 0 })).toEqual([]);
  });

  it("lets the jumper step orthogonally and jump over any occupied middle square", () => {
    const board = createBoardWithPieces([
      { row: 2, col: 2, type: "jumper", owner: 1 },
      { row: 2, col: 3, type: "killer", owner: 0 },
      { row: 0, col: 0, type: "king", owner: 0 },
      { row: 4, col: 4, type: "king", owner: 1 },
    ]);
    const state = createState(board, 1);

    const actions = getLegalActionsForPiece(state, { row: 2, col: 2 });

    expect(actions).toContainEqual({
      type: "move",
      from: { row: 2, col: 2 },
      to: { row: 1, col: 2 },
    });
    expect(actions).toContainEqual({
      type: "move",
      from: { row: 2, col: 2 },
      to: { row: 2, col: 4 },
    });
  });

  it("allows the jumper to capture only kings", () => {
    const board = createBoardWithPieces([
      { row: 2, col: 2, type: "jumper", owner: 1 },
      { row: 2, col: 3, type: "killer", owner: 0 },
      { row: 3, col: 2, type: "king", owner: 0 },
      { row: 4, col: 4, type: "king", owner: 1 },
    ]);
    const state = createState(board, 1);

    const actions = getLegalActionsForPiece(state, { row: 2, col: 2 });

    expect(actions).not.toContainEqual({
      type: "capture",
      from: { row: 2, col: 2 },
      to: { row: 2, col: 3 },
    });
    expect(actions).toContainEqual({
      type: "capture",
      from: { row: 2, col: 2 },
      to: { row: 3, col: 2 },
    });
  });

  it("resolves move intent into the normalized legal action", () => {
    const board = createBoardWithPieces([
      { row: 2, col: 2, type: "killer", owner: 1 },
      { row: 1, col: 1, type: "jumper", owner: 0 },
      { row: 0, col: 0, type: "king", owner: 0 },
      { row: 4, col: 4, type: "king", owner: 1 },
    ]);
    const state = createState(board, 1);

    const action = resolveMoveIntent(state, {
      from: { row: 2, col: 2 },
      to: { row: 1, col: 1 },
    });

    expect(action).toEqual({
      type: "capture",
      from: { row: 2, col: 2 },
      to: { row: 1, col: 1 },
    });
  });

  it("applies actions immutably and advances the turn", () => {
    const state = createInitialState();
    const originalSnapshot = structuredClone(state);

    const result = applyAction(state, {
      type: "move",
      from: { row: 2, col: 0 },
      to: { row: 1, col: 0 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(state).toEqual(originalSnapshot);
    expect(result.state.board[2][0]).toBeNull();
    expect(result.state.board[1][0]).toEqual({ type: "jumper", owner: 1 });
    expect(result.state.currentPlayer).toBe(0);
    expect(result.state.turnCount).toBe(1);
    expect(result.events).toContainEqual({ type: "turn_changed", player: 0 });
  });

  it("tracks captures and auto-skips a stuck player", () => {
    const board = createBoardWithPieces([
      { row: 2, col: 2, type: "killer", owner: 1 },
      { row: 1, col: 1, type: "jumper", owner: 0 },
      { row: 0, col: 0, type: "king", owner: 0 },
      { row: 4, col: 4, type: "king", owner: 1 },
    ]);
    const state = createState(board, 1);

    const result = applyAction(state, {
      type: "capture",
      from: { row: 2, col: 2 },
      to: { row: 1, col: 1 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.state.capturedByPlayer).toEqual([0, 1]);
    expect(result.state.currentPlayer).toBe(1);
    expect(result.events).toContainEqual({
      type: "piece_captured",
      by: 1,
      at: { row: 1, col: 1 },
      piece: { type: "jumper", owner: 0 },
    });
    expect(result.events).toContainEqual({ type: "turn_skipped", player: 0 });
    expect(result.events).toContainEqual({ type: "turn_changed", player: 1 });
  });

  it("ends the game immediately when a king is captured", () => {
    const board = createBoardWithPieces([
      { row: 2, col: 2, type: "killer", owner: 1 },
      { row: 1, col: 1, type: "king", owner: 0 },
      { row: 4, col: 4, type: "king", owner: 1 },
    ]);
    const state = createState(board, 1);

    const result = applyAction(state, {
      type: "capture",
      from: { row: 2, col: 2 },
      to: { row: 1, col: 1 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(isGameOver(result.state)).toBe(true);
    expect(getWinner(result.state)).toBe(1);
    expect(result.state.endReason).toBe("king_captured");
    expect(result.events).toContainEqual({
      type: "game_ended",
      winner: 1,
      reason: "king_captured",
    });
  });

  it("resolves a stuck turn into an automatic skip", () => {
    const board = createBoardWithPieces([
      { row: 0, col: 0, type: "king", owner: 0 },
      { row: 4, col: 4, type: "king", owner: 1 },
      { row: 3, col: 3, type: "killer", owner: 1 },
    ]);
    const state = createState(board, 0);

    const result = resolveTurnState(state);

    expect(result.state.status).toBe("playing");
    expect(result.state.currentPlayer).toBe(1);
    expect(result.events).toEqual([{ type: "turn_skipped", player: 0 }]);
  });

  it("ends in a draw when both players are stuck", () => {
    const board = createBoardWithPieces([
      { row: 0, col: 0, type: "king", owner: 0 },
      { row: 4, col: 4, type: "king", owner: 1 },
    ]);
    const state = createState(board, 1);

    const result = resolveTurnState(state);

    expect(result.state.status).toBe("ended");
    expect(result.state.winner).toBeNull();
    expect(result.state.endReason).toBe("double_stuck");
    expect(result.events).toEqual([
      { type: "turn_skipped", player: 1 },
      { type: "game_ended", winner: null, reason: "double_stuck" },
    ]);
  });
});

function createState(
  board: CrownChaseBoard,
  currentPlayer: PlayerId,
): CrownChaseState {
  return {
    board,
    currentPlayer,
    turnCount: 0,
    status: "playing",
    winner: null,
    endReason: null,
    capturedByPlayer: [0, 0],
  };
}

function createBoardWithPieces(
  pieces: Array<CrownChasePiece & Position>,
): CrownChaseBoard {
  const board = createEmptyBoard();

  for (const piece of pieces) {
    board[piece.row][piece.col] = {
      type: piece.type,
      owner: piece.owner,
    };
  }

  return board;
}

function createEmptyBoard(): CrownChaseBoard {
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => null),
  );
}
