export type PlayerId = 0 | 1;

export type PieceType = "sum" | "sumDiag";

export type MathWarStatus = "playing" | "ended";

export type MathWarEndReason = "captain_captured";

export type MoveInvalidReason =
  | "game_over"
  | "out_of_bounds"
  | "same_square"
  | "no_piece"
  | "not_your_piece"
  | "ally_on_destination"
  | "invalid_direction"
  | "path_blocked"
  | "insufficient_energy";

export interface Position {
  row: number;
  col: number;
}

export type DiceRoll = [number, number];

export interface MathWarPiece {
  id: string;
  type: PieceType;
  owner: PlayerId;
  value: 2 | 3 | 4;
  isCaptain: boolean;
}

export type MathWarBoard = (MathWarPiece | null)[][];

export interface MoveCostDetails {
  totalCost: number;
  movementCost: number;
  captureCost: number;
  distance: number;
  captureAddsCost: boolean;
  captainRuleChangedCost: boolean;
}

export interface MoveEvaluation {
  isValid: boolean;
  invalidReason: MoveInvalidReason | null;
  availableEnergy: number;
  requiredEnergy: number;
  cost: MoveCostDetails | null;
  actionType: "move" | "capture" | null;
  piece: MathWarPiece | null;
  targetPiece: MathWarPiece | null;
}

export interface MoveIntent {
  from: Position;
  to: Position;
}

export interface MathWarAction extends MoveIntent {
  type: "move" | "capture";
  cost: MoveCostDetails;
  evaluation: MoveEvaluation;
  capturedPiece?: MathWarPiece;
}

export interface MathWarState {
  board: MathWarBoard;
  currentPlayer: PlayerId;
  turnCount: number;
  status: MathWarStatus;
  winner: PlayerId | null;
  endReason: MathWarEndReason | null;
  diceRoll: DiceRoll;
  lastAction: MathWarAction | null;
}

export type MathWarEvent =
  | {
      type: "piece_captured";
      by: PlayerId;
      at: Position;
      piece: MathWarPiece;
    }
  | {
      type: "dice_rolled";
      diceRoll: DiceRoll;
      total: number;
      player: PlayerId;
    }
  | {
      type: "turn_changed";
      player: PlayerId;
    }
  | {
      type: "game_ended";
      winner: PlayerId;
      reason: MathWarEndReason;
    };

export type ApplyActionFailureReason = "game_over" | "illegal_move";

export type ApplyActionResult =
  | {
      ok: true;
      state: MathWarState;
      action: MathWarAction;
      events: MathWarEvent[];
    }
  | {
      ok: false;
      reason: ApplyActionFailureReason;
      evaluation: MoveEvaluation;
    };
