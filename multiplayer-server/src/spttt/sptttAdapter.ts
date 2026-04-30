import {
  applyMove,
  createInitialState,
  isMoveIntentValid,
} from "../../../src/SPTTT/Logic/v2/index.ts";
import type {
  ApplyMoveResult,
  MoveIntent,
  SptttPlayer,
  SptttState,
} from "../../../src/SPTTT/Logic/v2/index.ts";

export function createMultiplayerInitialState(): SptttState {
  return createInitialState();
}

export function resolveMultiplayerMove(
  state: SptttState,
  intent: MoveIntent,
  playerMark: SptttPlayer,
): MoveIntent | null {
  if (state.currentPlayer !== playerMark) {
    return null;
  }

  return isMoveIntentValid(state, intent) ? intent : null;
}

export function applyMultiplayerMove(
  state: SptttState,
  intent: MoveIntent,
): ApplyMoveResult {
  return applyMove(state, intent);
}
