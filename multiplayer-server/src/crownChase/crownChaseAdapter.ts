import {
  applyAction,
  createInitialState,
  resolveMoveIntent,
} from "../../../src/CrownChase/Logic/v2/index.ts";
import type {
  ApplyActionResult,
  CrownChaseAction,
  CrownChaseState,
  MoveIntent,
  PlayerId,
} from "../../../src/CrownChase/Logic/v2/index.ts";

export function createMultiplayerInitialState(): CrownChaseState {
  return createInitialState({ startingPlayer: 1 });
}

export function resolveMultiplayerMove(
  state: CrownChaseState,
  intent: MoveIntent,
  player: PlayerId,
): CrownChaseAction | null {
  return resolveMoveIntent(state, intent, player);
}

export function applyMultiplayerMove(
  state: CrownChaseState,
  action: CrownChaseAction,
): ApplyActionResult {
  return applyAction(state, action);
}
