import { describe, expect, it } from "vitest";

import { getAIMove } from "./aiPlayer";
import { getLegalActions } from "./v2";
import type {
  CrownChaseBoard,
  CrownChasePiece,
  CrownChaseState,
  PlayerId,
  Position,
} from "./v2";

describe("Crown Chase AI", () => {
  it("returns a legal action for every supported difficulty", () => {
    const state = createState(
      createBoardWithPieces([
        { row: 2, col: 2, type: "killer", owner: 0 },
        { row: 1, col: 2, type: "jumper", owner: 0 },
        { row: 0, col: 0, type: "king", owner: 0 },
        { row: 4, col: 4, type: "king", owner: 1 },
        { row: 3, col: 3, type: "killer", owner: 1 },
      ]),
      0,
    );
    const legalActions = getLegalActions(state);

    for (const difficulty of [1, 2, 3, 4] as const) {
      const action = getAIMove(state, difficulty);
      expect(legalActions).toContainEqual(action);
    }
  });

  it("takes an immediate king capture on difficulty 4", () => {
    const state = createState(
      createBoardWithPieces([
        { row: 2, col: 2, type: "killer", owner: 0 },
        { row: 1, col: 1, type: "king", owner: 1 },
        { row: 4, col: 4, type: "king", owner: 0 },
      ]),
      0,
    );

    expect(getAIMove(state, 4)).toEqual({
      type: "capture",
      from: { row: 2, col: 2 },
      to: { row: 1, col: 1 },
    });
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
