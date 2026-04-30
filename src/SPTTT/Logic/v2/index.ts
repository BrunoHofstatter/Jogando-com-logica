export {
  applyMove,
  checkBoardWinner,
  createInitialState,
  getAvailableMoves,
  getGameWinner,
  getNextActiveBoard,
  getNextPlayer,
  isMoveIntentValid,
} from "./spttt";

export type {
  ApplyMoveFailureReason,
  ApplyMoveResult,
  MiniBoard,
  MoveIntent,
  SptttBoardResult,
  SptttCell,
  SptttPlayer,
  SptttState,
  SptttWinner,
  UltimateBoard,
} from "./types";
