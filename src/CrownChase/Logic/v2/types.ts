export type PlayerId = 0 | 1;

export type PieceType = "king" | "killer" | "jumper";

export type CrownChaseStatus = "playing" | "ended";

export type CrownChaseEndReason = "king_captured" | "double_stuck";

export type ApplyActionFailureReason = "game_over" | "illegal_action";

export interface Position {
  row: number;
  col: number;
}

export interface MoveIntent {
  from: Position;
  to: Position;
}

export interface CrownChasePiece {
  type: PieceType;
  owner: PlayerId;
}

export type CrownChaseBoard = (CrownChasePiece | null)[][];

export interface CrownChaseAction extends MoveIntent {
  type: "move" | "capture";
}

export interface CrownChaseState {
  board: CrownChaseBoard;
  currentPlayer: PlayerId;
  turnCount: number;
  status: CrownChaseStatus;
  winner: PlayerId | null;
  endReason: CrownChaseEndReason | null;
  capturedByPlayer: [number, number];
}

export type CrownChaseEvent =
  | {
      type: "piece_captured";
      by: PlayerId;
      at: Position;
      piece: CrownChasePiece;
    }
  | {
      type: "turn_skipped";
      player: PlayerId;
    }
  | {
      type: "turn_changed";
      player: PlayerId;
    }
  | {
      type: "game_ended";
      winner: PlayerId | null;
      reason: CrownChaseEndReason;
    };

export interface ResolveTurnStateResult {
  state: CrownChaseState;
  events: CrownChaseEvent[];
}

export type ApplyActionResult =
  | {
      ok: true;
      state: CrownChaseState;
      events: CrownChaseEvent[];
    }
  | {
      ok: false;
      reason: ApplyActionFailureReason;
    };
