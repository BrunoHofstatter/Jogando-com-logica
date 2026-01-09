import { UltimateBoard, BoardResult, Move, getAvailableMoves } from "./gameUtils";

export function getAIMove(
  boards: UltimateBoard,
  winners: Array<BoardResult>,
  activeBoard: number | null
): Move {
  const availableMoves = getAvailableMoves(boards, winners, activeBoard);

  if (availableMoves.length === 0) {
    throw new Error("No available moves for AI");
  }

  // Level 1: Random Move
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
}
