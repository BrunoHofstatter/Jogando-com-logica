import { describe, expect, it } from "vitest";

import { getAIMove } from "./aiPlayer";
import { createInitialState, getAvailableMoves } from "./v2";
import type { MiniBoard, SptttState } from "./v2";

describe("SPTTT AI", () => {
  it("returns a legal move for every supported difficulty", () => {
    const state = createState({
      activeBoard: 0,
      boards: createBoards({
        0: createMiniBoard(["X", null, null, null, "O", null, null, null, null]),
      }),
    });
    const legalMoves = getAvailableMoves(state);

    for (const difficulty of [1, 2, 3, 4] as const) {
      expect(legalMoves).toContainEqual(getAIMove(state, difficulty));
    }
  });

  it("takes an immediate winning move on difficulty 4", () => {
    const state = createState({
      activeBoard: 0,
      currentPlayer: "O",
      boards: createBoards({
        0: createMiniBoard(["O", "O", null, null, "X", null, null, null, "X"]),
      }),
    });

    expect(getAIMove(state, 4)).toEqual({
      boardIndex: 0,
      cellIndex: 2,
    });
  });
});

function createState(overrides: Partial<SptttState>): SptttState {
  return {
    ...createInitialState(),
    ...overrides,
  };
}

function createBoards(overrides: Partial<Record<number, MiniBoard>>): SptttState["boards"] {
  const boards = createInitialState().boards.map((board) => [...board]);

  for (const [rawIndex, board] of Object.entries(overrides)) {
    if (!board) {
      continue;
    }

    boards[Number(rawIndex)] = [...board];
  }

  return boards;
}

function createMiniBoard(cells: MiniBoard): MiniBoard {
  return [...cells];
}
