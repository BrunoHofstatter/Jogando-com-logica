import { describe, expect, it } from "vitest";

import {
  applyMove,
  createInitialState,
  getAvailableMoves,
  getGameWinner,
  getNextActiveBoard,
  isMoveIntentValid,
} from "./index";
import type { MiniBoard, SptttBoardResult, SptttState } from "./index";

describe("SPTTT v2 domain", () => {
  it("creates the agreed initial line-mode state", () => {
    const state = createInitialState();

    expect(state.currentPlayer).toBe("X");
    expect(state.activeBoard).toBeNull();
    expect(state.status).toBe("playing");
    expect(state.winner).toBeNull();
    expect(state.turnCount).toBe(0);
    expect(getAvailableMoves(state)).toHaveLength(81);
  });

  it("validates move bounds and active-board restrictions", () => {
    const baseState = createInitialState();
    const activeBoardState: SptttState = {
      ...baseState,
      activeBoard: 4,
    };

    expect(isMoveIntentValid(baseState, { boardIndex: 2, cellIndex: 7 })).toBe(true);
    expect(isMoveIntentValid(baseState, { boardIndex: 9, cellIndex: 0 })).toBe(false);
    expect(isMoveIntentValid(activeBoardState, { boardIndex: 1, cellIndex: 4 })).toBe(false);
    expect(isMoveIntentValid(activeBoardState, { boardIndex: 4, cellIndex: 4 })).toBe(true);
  });

  it("applies a move immutably and sends the next player to the targeted board", () => {
    const state = createInitialState();

    const result = applyMove(state, { boardIndex: 0, cellIndex: 4 });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(state.boards[0][4]).toBeNull();
    expect(result.state.boards[0][4]).toBe("X");
    expect(result.state.currentPlayer).toBe("O");
    expect(result.state.activeBoard).toBe(4);
    expect(result.state.turnCount).toBe(1);
  });

  it("opens all remaining boards when the target board is already decided", () => {
    const result = applyMove(
      createState({
        activeBoard: 0,
        currentPlayer: "X",
        boardWinners: [null, null, null, null, "tie", null, null, null, null],
        boards: createBoards({
          0: createMiniBoard(["X", "X", null, null, null, null, null, null, null]),
        }),
      }),
      { boardIndex: 0, cellIndex: 4 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.state.activeBoard).toBeNull();
  });

  it("marks a mini-board as won when a line is completed", () => {
    const result = applyMove(
      createState({
        activeBoard: 0,
        boards: createBoards({
          0: createMiniBoard(["X", "X", null, null, null, null, null, null, null]),
        }),
      }),
      { boardIndex: 0, cellIndex: 2 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.state.boardWinners[0]).toBe("X");
  });

  it("ends the game when a player completes a big-board line", () => {
    const result = applyMove(
      createState({
        activeBoard: 2,
        currentPlayer: "X",
        boardWinners: ["X", "X", null, null, null, null, null, null, null],
        boards: createBoards({
          2: createMiniBoard(["X", "X", null, null, null, null, null, null, null]),
        }),
      }),
      { boardIndex: 2, cellIndex: 2 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.state.status).toBe("ended");
    expect(result.state.winner).toBe("X");
    expect(result.state.winningLine).toEqual([0, 1, 2]);
    expect(result.state.activeBoard).toBeNull();
  });

  it("ends in a tie when all mini-boards are decided without a line", () => {
    expect(
      getGameWinner(["X", "O", "X", "X", "O", "O", "O", "X", "tie"]),
    ).toEqual({
      winner: "tie",
      winningLine: null,
    });
  });

  it("rejects illegal moves after the game has ended", () => {
    const endedState: SptttState = {
      ...createInitialState(),
      status: "ended",
      winner: "X",
      winningLine: [0, 1, 2],
    };

    expect(applyMove(endedState, { boardIndex: 0, cellIndex: 0 })).toEqual({
      ok: false,
      reason: "game_ended",
    });
  });

  it("computes the next active board from the played cell", () => {
    const boardWinners: SptttBoardResult[] = Array.from({ length: 9 }, () => null);
    boardWinners[6] = "tie";

    expect(getNextActiveBoard(3, boardWinners)).toBe(3);
    expect(getNextActiveBoard(6, boardWinners)).toBeNull();
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
