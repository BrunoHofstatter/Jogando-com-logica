import type { Position } from "../Logic/v2";

export function toLogicalBoardPosition(
  displayPosition: Position,
  boardHeight: number,
  boardWidth: number,
  isRotated: boolean,
): Position {
  if (!isRotated) {
    return displayPosition;
  }

  return {
    row: boardHeight - 1 - displayPosition.row,
    col: boardWidth - 1 - displayPosition.col,
  };
}
