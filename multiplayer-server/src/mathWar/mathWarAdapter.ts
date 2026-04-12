import {
  applyAction,
  createInitialState,
  resolveMoveIntent,
} from "../../../src/MathWar/Logic/v2/index.ts";
import type {
  ApplyActionResult,
  MathWarAction,
  MathWarState,
  MoveIntent,
  PlayerId,
} from "../../../src/MathWar/Logic/v2/index.ts";

export function createMultiplayerInitialState(): MathWarState {
  return createInitialState({ startingPlayer: 1 });
}

export function resolveMultiplayerMove(
  state: MathWarState,
  intent: MoveIntent,
  player: PlayerId,
): MathWarAction | null {
  return resolveMoveIntent(state, intent, player);
}

export function applyMultiplayerMove(
  state: MathWarState,
  action: MathWarAction,
): ApplyActionResult {
  return applyAction(state, action);
}
