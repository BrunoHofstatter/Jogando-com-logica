import {
  applyPlayerAction,
  createInitialState,
  createPointsRaceConfig,
  expireRound,
} from "../../../src/Caca_soma/Logic/v2/index.ts";
import type {
  ApplyPlayerActionResult,
  CacaSomaMatchState,
  CacaSomaPlayerAction,
  ExpireRoundResult,
} from "../../../src/Caca_soma/Logic/v2/index.ts";
import type {
  CacaSomaRoomSeat,
  CacaSomaRoomSettings,
  PlayerIntent,
} from "../../../src/Caca_soma/Logic/multiplayer/protocol.ts";
import { getSeatInfo } from "./cacaSomaRoomTypes.ts";

export function createMultiplayerInitialState(
  settings: CacaSomaRoomSettings,
  nowMs: number,
): CacaSomaMatchState {
  const config = createPointsRaceConfig({
    difficultyId: settings.difficultyId,
    targetScore: settings.targetScore,
    teamSize: 2,
  });

  return createInitialState(config, nowMs);
}

export function resolveMultiplayerAction(
  seat: CacaSomaRoomSeat,
  intent: PlayerIntent,
  nowMs: number,
): CacaSomaPlayerAction {
  const { team, playerIndex } = getSeatInfo(seat);

  if (intent.type === "set_player_selection") {
    return {
      type: "set_player_selection",
      team,
      playerIndex,
      cellIds: intent.cellIds,
      nowMs,
    };
  }

  return {
    type: "set_player_ready",
    team,
    playerIndex,
    ready: intent.ready,
    nowMs,
  };
}

export function applyMultiplayerAction(
  state: CacaSomaMatchState,
  action: CacaSomaPlayerAction,
): ApplyPlayerActionResult {
  return applyPlayerAction(state, action);
}

export function expireMultiplayerRound(
  state: CacaSomaMatchState,
  nowMs: number,
): ExpireRoundResult {
  return expireRound(state, nowMs);
}
