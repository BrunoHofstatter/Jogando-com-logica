import { describe, expect, it } from "vitest";

import { createInitialState } from "../Logic/v2";
import { toLogicalBoardPosition } from "./boardOrientation";

const BOARD_SIZE = 5;

describe("Crown Chase board orientation", () => {
  it("keeps canonical coordinates in the normal view", () => {
    expect(
      toLogicalBoardPosition({ row: 1, col: 3 }, BOARD_SIZE, BOARD_SIZE, false),
    ).toEqual({ row: 1, col: 3 });
  });

  it("maps every display corner through a 180-degree rotation", () => {
    expect(
      toLogicalBoardPosition({ row: 0, col: 0 }, BOARD_SIZE, BOARD_SIZE, true),
    ).toEqual({ row: 4, col: 4 });
    expect(
      toLogicalBoardPosition({ row: 0, col: 4 }, BOARD_SIZE, BOARD_SIZE, true),
    ).toEqual({ row: 4, col: 0 });
    expect(
      toLogicalBoardPosition({ row: 4, col: 0 }, BOARD_SIZE, BOARD_SIZE, true),
    ).toEqual({ row: 0, col: 4 });
    expect(
      toLogicalBoardPosition({ row: 4, col: 4 }, BOARD_SIZE, BOARD_SIZE, true),
    ).toEqual({ row: 0, col: 0 });
  });

  it("keeps the center square fixed when rotated", () => {
    expect(
      toLogicalBoardPosition({ row: 2, col: 2 }, BOARD_SIZE, BOARD_SIZE, true),
    ).toEqual({ row: 2, col: 2 });
  });

  it("places the red king at the display bottom-left", () => {
    const state = createInitialState();
    const logicalPosition = toLogicalBoardPosition(
      { row: 4, col: 0 },
      state.board.length,
      state.board[0].length,
      true,
    );

    expect(logicalPosition).toEqual({ row: 0, col: 4 });
    expect(state.board[logicalPosition.row][logicalPosition.col]).toEqual({
      type: "king",
      owner: 0,
    });
  });

  it("maps a red player's display click back to canonical coordinates", () => {
    expect(
      toLogicalBoardPosition({ row: 3, col: 1 }, BOARD_SIZE, BOARD_SIZE, true),
    ).toEqual({ row: 1, col: 3 });
  });
});
