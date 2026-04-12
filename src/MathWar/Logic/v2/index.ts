export {
  applyAction,
  calculateMoveCost,
  cloneBoard,
  createEmptyBoard,
  createInitialState,
  createState,
  evaluateMove,
  getDiceTotal,
  getLegalActions,
  getLegalActionsForPiece,
  getPieceAt,
  getPieceAvailableEnergy,
  getPlayerPieces,
  getRoundsUntilNextRoll,
  isGameOver,
  MATH_WAR_BOARD_HEIGHT,
  MATH_WAR_BOARD_WIDTH,
  resolveMoveIntent,
} from "./mathWar";

export { getAIMove } from "./ai";

export type { AIDifficulty } from "./ai";

export type {
  ApplyActionFailureReason,
  ApplyActionResult,
  DiceRoll,
  MathWarAction,
  MathWarBoard,
  MathWarEndReason,
  MathWarEvent,
  MathWarPiece,
  MathWarState,
  MathWarStatus,
  MoveCostDetails,
  MoveEvaluation,
  MoveIntent,
  MoveInvalidReason,
  PieceType,
  PlayerId,
  Position,
} from "./types";
