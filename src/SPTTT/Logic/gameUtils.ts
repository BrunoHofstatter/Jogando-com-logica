export type Player = "X" | "O" | null;
export type BoardResult = Player | "tie";
export type MiniBoard = Player[];
export type UltimateBoard = MiniBoard[];

export interface Move {
  boardIndex: number;
  cellIndex: number;
}

export function checkWinner(board: MiniBoard): BoardResult {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  // Check for tie (board is full with no winner)
  if (board.every((cell) => cell !== null)) {
    return "tie";
  }

  return null;
}

export function checkBigBoardWinner(
  winners: Array<BoardResult>,
  winCondition: "line" | "majority"
): { winner: BoardResult | null; winningLine: number[] | null } {
  if (winCondition === "line") {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // cols
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (let [a, b, c] of lines) {
      if (
        winners[a] &&
        winners[a] === winners[b] &&
        winners[a] === winners[c] &&
        winners[a] !== "tie"
      ) {
        return { winner: winners[a], winningLine: [a, b, c] };
      }
    }

    if (winners.every((winner) => winner !== null)) {
      return { winner: "tie", winningLine: null };
    }
  } else {
    // Majority win condition
    if (winners.every((winner) => winner !== null)) {
      const countX = winners.filter((winner) => winner === "X").length;
      const countO = winners.filter((winner) => winner === "O").length;

      if (countX > countO) return { winner: "X", winningLine: null };
      if (countO > countX) return { winner: "O", winningLine: null };
      return { winner: "tie", winningLine: null };
    }
  }

  return { winner: null, winningLine: null };
}

export function isValidMove(
  boardIndex: number,
  cellIndex: number,
  boards: UltimateBoard,
  winners: Array<BoardResult>,
  activeBoard: number | null
): boolean {
  if (winners[boardIndex] !== null) return false;
  if (activeBoard !== null && activeBoard !== boardIndex) return false;
  if (boards[boardIndex][cellIndex] !== null) return false;
  return true;
}

export function getNextBoard(cellIndex: number, winners: Array<BoardResult>): number | null {
  if (winners[cellIndex] !== null) {
    return null;
  }
  return cellIndex;
}

export function getAvailableMoves(
  boards: UltimateBoard,
  winners: Array<BoardResult>,
  activeBoard: number | null
): Move[] {
  const moves: Move[] = [];
  const boardsToCheck = activeBoard !== null ? [activeBoard] : [0, 1, 2, 3, 4, 5, 6, 7, 8];

  for (const bIdx of boardsToCheck) {
    // If the board is already won/tied, we can't move there (unless activeBoard is null, but logic below handles it)
    // Actually, if activeBoard is null, we can move anywhere that isn't won.
    // If activeBoard is set, it's guaranteed not to be won (otherwise it would be null).

    if (winners[bIdx] !== null) continue;

    for (let cIdx = 0; cIdx < 9; cIdx++) {
      if (boards[bIdx][cIdx] === null) {
        moves.push({ boardIndex: bIdx, cellIndex: cIdx });
      }
    }
  }
  return moves;
}
