import { describe, expect, it } from "vitest";

import {
  applyAction,
  calculateMoveCost,
  createEmptyBoard,
  createInitialState,
  createState,
  evaluateMove,
  getLegalActionsForPiece,
  getPieceAvailableEnergy,
} from "./index";
import type { MathWarBoard } from "./index";

function buildBoard(): MathWarBoard {
  return createEmptyBoard();
}

describe("Math War v2", () => {
  it("creates an initial state with one captain per player and an initial dice roll", () => {
    const state = createInitialState({
      startingPlayer: 1,
      startingDiceRoll: [4, 5],
      rng: () => 0,
    });

    const pieces = state.board.flat().filter(Boolean);
    const captains = pieces.filter((piece) => piece?.isCaptain);
    const playerZeroCaptain = state.board[0].filter((piece) => piece?.owner === 0 && piece?.isCaptain);
    const playerOneCaptain = state.board[7].filter((piece) => piece?.owner === 1 && piece?.isCaptain);

    expect(state.currentPlayer).toBe(1);
    expect(state.diceRoll).toEqual([4, 5]);
    expect(pieces).toHaveLength(20);
    expect(captains).toHaveLength(2);
    expect(playerZeroCaptain).toHaveLength(1);
    expect(playerOneCaptain).toHaveLength(1);
  });

  it("explains why a move fails when energy is insufficient", () => {
    const board = buildBoard();
    board[0][0] = {
      id: "p0",
      type: "sum",
      owner: 0,
      value: 2,
      isCaptain: false,
    };

    const state = createState({
      board,
      currentPlayer: 0,
      diceRoll: [1, 1],
    });

    const evaluation = evaluateMove(state, {
      from: { row: 0, col: 0 },
      to: { row: 0, col: 3 },
    });

    expect(evaluation.isValid).toBe(false);
    expect(evaluation.invalidReason).toBe("insufficient_energy");
    expect(evaluation.availableEnergy).toBe(4);
    expect(evaluation.requiredEnergy).toBe(6);
  });

  it("returns cost details including capture and captain modifiers", () => {
    const board = buildBoard();
    board[0][0] = {
      id: "captain",
      type: "sum",
      owner: 0,
      value: 4,
      isCaptain: true,
    };
    board[0][2] = {
      id: "enemy",
      type: "sum",
      owner: 1,
      value: 2,
      isCaptain: false,
    };

    const state = createState({
      board,
      currentPlayer: 0,
      diceRoll: [2, 2],
    });

    const cost = calculateMoveCost(state, {
      from: { row: 0, col: 0 },
      to: { row: 0, col: 2 },
    });

    expect(cost).not.toBeNull();
    expect(cost?.movementCost).toBe(4);
    expect(cost?.captureCost).toBe(2);
    expect(cost?.captureAddsCost).toBe(true);
    expect(cost?.captainRuleChangedCost).toBe(true);
    expect(cost?.totalCost).toBe(12);
  });

  it("returns the exact legal moves for a selected piece", () => {
    const board = buildBoard();
    board[4][4] = {
      id: "diag",
      type: "sumDiag",
      owner: 0,
      value: 4,
      isCaptain: false,
    };
    board[3][3] = {
      id: "enemy",
      type: "sum",
      owner: 1,
      value: 2,
      isCaptain: false,
    };
    board[5][5] = {
      id: "ally",
      type: "sum",
      owner: 0,
      value: 2,
      isCaptain: false,
    };

    const state = createState({
      board,
      currentPlayer: 0,
      diceRoll: [2, 3],
    });

    const actions = getLegalActionsForPiece(state, { row: 4, col: 4 });
    const targets = actions.map((action) => `${action.to.row},${action.to.col}:${action.type}`);

    expect(targets).toEqual([
      "3,3:capture",
      "3,5:move",
      "2,6:move",
      "1,7:move",
      "5,3:move",
      "6,2:move",
      "7,1:move",
    ]);
  });

  it("applies a move, changes turns, and rolls dice every third turn", () => {
    const board = buildBoard();
    board[0][0] = {
      id: "mover",
      type: "sum",
      owner: 0,
      value: 4,
      isCaptain: false,
    };

    const state = createState({
      board,
      currentPlayer: 0,
      turnCount: 2,
      diceRoll: [3, 3],
    });

    const action = getLegalActionsForPiece(state, { row: 0, col: 0 })[0];
    const result = applyAction(state, action, { nextDiceRoll: [5, 5] });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.state.currentPlayer).toBe(1);
    expect(result.state.turnCount).toBe(3);
    expect(result.state.diceRoll).toEqual([5, 5]);
    expect(result.events.some((event) => event.type === "dice_rolled")).toBe(true);
  });

  it("derives piece energy without mutating the piece", () => {
    const board = buildBoard();
    board[2][2] = {
      id: "energy",
      type: "sum",
      owner: 0,
      value: 3,
      isCaptain: false,
    };

    const state = createState({
      board,
      currentPlayer: 0,
      diceRoll: [2, 4],
    });

    expect(getPieceAvailableEnergy(state, { row: 2, col: 2 })).toBe(9);
    expect(state.board[2][2]?.isCaptain).toBe(false);
  });
});
