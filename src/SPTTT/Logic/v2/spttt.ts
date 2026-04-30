import type {
  ApplyMoveResult,
  MiniBoard,
  MoveIntent,
  SptttBoardResult,
  SptttPlayer,
  SptttState,
  SptttWinner,
  UltimateBoard,
} from "./types";

const BOARD_COUNT = 9;
const CELL_COUNT = 9;

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function createInitialState(): SptttState {
  return {
    boards: createEmptyUltimateBoard(),
    boardWinners: Array.from({ length: BOARD_COUNT }, () => null),
    currentPlayer: "X",
    activeBoard: null,
    status: "playing",
    winner: null,
    winningLine: null,
    turnCount: 0,
  };
}

export function checkBoardWinner(board: MiniBoard): SptttBoardResult {
  for (const [first, second, third] of WINNING_LINES) {
    if (
      board[first] !== null &&
      board[first] === board[second] &&
      board[first] === board[third]
    ) {
      return board[first];
    }
  }

  return board.every((cell) => cell !== null) ? "tie" : null;
}

export function getGameWinner(
  boardWinners: readonly SptttBoardResult[],
): { winner: SptttWinner; winningLine: number[] | null } {
  for (const [first, second, third] of WINNING_LINES) {
    if (
      boardWinners[first] !== null &&
      boardWinners[first] !== "tie" &&
      boardWinners[first] === boardWinners[second] &&
      boardWinners[first] === boardWinners[third]
    ) {
      return {
        winner: boardWinners[first],
        winningLine: [first, second, third],
      };
    }
  }

  if (boardWinners.every((winner) => winner !== null)) {
    return {
      winner: "tie",
      winningLine: null,
    };
  }

  return {
    winner: null,
    winningLine: null,
  };
}

export function getNextActiveBoard(
  cellIndex: number,
  boardWinners: readonly SptttBoardResult[],
): number | null {
  return boardWinners[cellIndex] === null ? cellIndex : null;
}

export function isMoveIntentValid(
  state: SptttState,
  intent: MoveIntent,
): boolean {
  if (state.status !== "playing") {
    return false;
  }

  if (!isBoardIndexInBounds(intent.boardIndex) || !isCellIndexInBounds(intent.cellIndex)) {
    return false;
  }

  if (state.boardWinners[intent.boardIndex] !== null) {
    return false;
  }

  if (state.activeBoard !== null && state.activeBoard !== intent.boardIndex) {
    return false;
  }

  return state.boards[intent.boardIndex][intent.cellIndex] === null;
}

export function getAvailableMoves(state: SptttState): MoveIntent[] {
  if (state.status !== "playing") {
    return [];
  }

  const candidateBoards =
    state.activeBoard === null
      ? Array.from({ length: BOARD_COUNT }, (_, index) => index)
      : [state.activeBoard];

  const moves: MoveIntent[] = [];

  for (const boardIndex of candidateBoards) {
    if (state.boardWinners[boardIndex] !== null) {
      continue;
    }

    for (let cellIndex = 0; cellIndex < CELL_COUNT; cellIndex += 1) {
      if (state.boards[boardIndex][cellIndex] === null) {
        moves.push({ boardIndex, cellIndex });
      }
    }
  }

  return moves;
}

export function applyMove(
  state: SptttState,
  intent: MoveIntent,
): ApplyMoveResult {
  if (state.status !== "playing") {
    return {
      ok: false,
      reason: "game_ended",
    };
  }

  if (!isBoardIndexInBounds(intent.boardIndex) || !isCellIndexInBounds(intent.cellIndex)) {
    return {
      ok: false,
      reason: "out_of_bounds",
    };
  }

  if (!isMoveIntentValid(state, intent)) {
    return {
      ok: false,
      reason: "illegal_move",
    };
  }

  const nextBoards = state.boards.map((board, boardIndex) =>
    boardIndex === intent.boardIndex
      ? board.map((cell, cellIndex) =>
          cellIndex === intent.cellIndex ? state.currentPlayer : cell,
        )
      : [...board],
  ) as UltimateBoard;

  const nextBoardWinners = [...state.boardWinners];
  const updatedBoardWinner = checkBoardWinner(nextBoards[intent.boardIndex]);
  if (updatedBoardWinner !== null) {
    nextBoardWinners[intent.boardIndex] = updatedBoardWinner;
  }

  const { winner, winningLine } = getGameWinner(nextBoardWinners);
  const nextStatus = winner === null ? "playing" : "ended";

  return {
    ok: true,
    state: {
      boards: nextBoards,
      boardWinners: nextBoardWinners,
      currentPlayer:
        nextStatus === "playing"
          ? getNextPlayer(state.currentPlayer)
          : state.currentPlayer,
      activeBoard:
        nextStatus === "playing"
          ? getNextActiveBoard(intent.cellIndex, nextBoardWinners)
          : null,
      status: nextStatus,
      winner,
      winningLine,
      turnCount: state.turnCount + 1,
    },
  };
}

export function getNextPlayer(player: SptttPlayer): SptttPlayer {
  return player === "X" ? "O" : "X";
}

function createEmptyUltimateBoard(): UltimateBoard {
  return Array.from({ length: BOARD_COUNT }, () =>
    Array.from({ length: CELL_COUNT }, () => null),
  );
}

function isBoardIndexInBounds(boardIndex: number): boolean {
  return Number.isInteger(boardIndex) && boardIndex >= 0 && boardIndex < BOARD_COUNT;
}

function isCellIndexInBounds(cellIndex: number): boolean {
  return Number.isInteger(cellIndex) && cellIndex >= 0 && cellIndex < CELL_COUNT;
}
