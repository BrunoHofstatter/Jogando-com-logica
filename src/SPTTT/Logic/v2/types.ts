export type SptttPlayer = "X" | "O";
export type SptttCell = SptttPlayer | null;
export type SptttBoardResult = SptttPlayer | "tie" | null;
export type SptttWinner = SptttPlayer | "tie" | null;
export type MiniBoard = SptttCell[];
export type UltimateBoard = MiniBoard[];

export interface MoveIntent {
  boardIndex: number;
  cellIndex: number;
}

export interface SptttState {
  boards: UltimateBoard;
  boardWinners: SptttBoardResult[];
  currentPlayer: SptttPlayer;
  activeBoard: number | null;
  status: "playing" | "ended";
  winner: SptttWinner;
  winningLine: number[] | null;
  turnCount: number;
}

export type ApplyMoveFailureReason =
  | "game_ended"
  | "illegal_move"
  | "out_of_bounds";

export type ApplyMoveResult =
  | {
      ok: true;
      state: SptttState;
    }
  | {
      ok: false;
      reason: ApplyMoveFailureReason;
    };
