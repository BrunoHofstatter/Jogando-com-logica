import {
  checkBoardWinner,
  getAvailableMoves,
  getGameWinner,
  getNextActiveBoard,
} from "./v2";
import type {
  MiniBoard,
  MoveIntent,
  SptttBoardResult,
  SptttState,
} from "./v2";

export function getAIMove(
  state: SptttState,
  difficulty: 1 | 2 | 3 | 4 = 1,
): MoveIntent {
  const availableMoves = getAvailableMoves(state);

  if (availableMoves.length === 0) {
    throw new Error("No available moves for AI");
  }

  if (difficulty === 4) {
    return getDifficulty4Move(state, availableMoves);
  }

  if (difficulty === 3) {
    return getDifficulty3Move(state, availableMoves);
  }

  if (difficulty === 2) {
    const winningMoves = availableMoves.filter((move) => {
      const board = state.boards[move.boardIndex];
      const nextBoard = [...board];
      nextBoard[move.cellIndex] = "O";
      return checkBoardWinner(nextBoard) === "O";
    });

    if (winningMoves.length > 0 && Math.random() < 0.8) {
      return pickRandomMove(winningMoves);
    }

    const blockingMoves = availableMoves.filter((move) => {
      const board = state.boards[move.boardIndex];
      const nextBoard = [...board];
      nextBoard[move.cellIndex] = "X";
      return checkBoardWinner(nextBoard) === "X";
    });

    if (blockingMoves.length > 0 && Math.random() < 0.8) {
      return pickRandomMove(blockingMoves);
    }
  }

  return pickRandomMove(availableMoves);
}

function getDifficulty3Move(
  state: SptttState,
  availableMoves: MoveIntent[],
): MoveIntent {
  let bestScore = -Infinity;
  let bestMoves: MoveIntent[] = [];

  for (const move of availableMoves) {
    const score = evaluateMove(state, move, 3);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
      continue;
    }

    if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return pickRandomMove(bestMoves);
}

function getDifficulty4Move(
  state: SptttState,
  availableMoves: MoveIntent[],
): MoveIntent {
  let bestScore = -Infinity;
  let bestMoves: MoveIntent[] = [];

  for (const move of availableMoves) {
    const score = evaluateMove(state, move, 4);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
      continue;
    }

    if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return pickRandomMove(bestMoves);
}

function evaluateMove(
  state: SptttState,
  move: MoveIntent,
  difficulty: 3 | 4,
): number {
  let score = 0;
  const boardIndex = move.boardIndex;
  const currentBoard = state.boards[boardIndex];
  const boardWinners = state.boardWinners;

  const boardWithMove = [...currentBoard];
  boardWithMove[move.cellIndex] = "O";
  const winsBoard = checkBoardWinner(boardWithMove) === "O";

  if (winsBoard) {
    score += 1000;

    const nextBoardWinners = [...boardWinners];
    nextBoardWinners[boardIndex] = "O";

    if (isBigBoardLine(nextBoardWinners, "O")) {
      score += 5000;
    }

    const threatenedBoardWinners = [...boardWinners];
    threatenedBoardWinners[boardIndex] = "X";
    if (isBigBoardLine(threatenedBoardWinners, "X")) {
      score += 4000;
    }

    if (difficulty === 4 && boardIndex === 4) {
      score += 300;
    }
  }

  const boardWithOpponentMove = [...currentBoard];
  boardWithOpponentMove[move.cellIndex] = "X";
  if (checkBoardWinner(boardWithOpponentMove) === "X") {
    score += 800;

    const threatenedBoardWinners = [...boardWinners];
    threatenedBoardWinners[boardIndex] = "X";
    if (isBigBoardLine(threatenedBoardWinners, "X")) {
      score += 3000;
    }
  }

  if (
    difficulty === 4 &&
    !winsBoard &&
    currentBoard[4] === null &&
    move.cellIndex === 4
  ) {
    score += 50;
  }

  const optimisticBoardWinners = [...boardWinners];
  if (winsBoard) {
    optimisticBoardWinners[boardIndex] = "O";
  }

  const targetBoardIndex = getNextActiveBoard(
    move.cellIndex,
    optimisticBoardWinners,
  );

  if (targetBoardIndex === null) {
    score -= difficulty === 4 ? 200 : 30;
  } else {
    const targetBoard = state.boards[targetBoardIndex];
    if (canWinBoard(targetBoard, "X")) {
      const safetyChance = difficulty === 4 ? 1.0 : 0.5;
      if (Math.random() < safetyChance) {
        score -= 2000;
      }
    }
  }

  const noise = difficulty === 4 ? 5 : 20;
  score += Math.random() * noise;

  return score;
}

function isBigBoardLine(
  boardWinners: SptttBoardResult[],
  player: "X" | "O",
): boolean {
  return getGameWinner(boardWinners).winner === player;
}

function canWinBoard(board: MiniBoard, player: "X" | "O"): boolean {
  for (let cellIndex = 0; cellIndex < board.length; cellIndex += 1) {
    if (board[cellIndex] !== null) {
      continue;
    }

    const nextBoard = [...board];
    nextBoard[cellIndex] = player;
    if (checkBoardWinner(nextBoard) === player) {
      return true;
    }
  }

  return false;
}

function pickRandomMove(moves: MoveIntent[]): MoveIntent {
  return moves[Math.floor(Math.random() * moves.length)];
}
