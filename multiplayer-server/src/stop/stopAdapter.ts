import {
  addStopMultiplayerPlayer,
  addStopMultiplayerRematchVote,
  archiveCurrentStopMultiplayerRound,
  createStopMultiplayerInitialState,
  moveStopMultiplayerRoundToResults,
  moveStopMultiplayerRoundToPlaying,
  markStopMultiplayerPlayerConnection,
  removeStopMultiplayerPlayer,
  restartStopMultiplayerMatch,
  resolveStopMultiplayerRoundLock,
  startStopMultiplayerMatch,
  advanceStopMultiplayerRound,
  updateStopMultiplayerSettings,
  type StopMultiplayerLogicResult,
} from "../../../src/Stop/Logic/multiplayer/matchLogic.ts";
import type { StopMultiplayerSettingsPatch } from "../../../src/Stop/Logic/multiplayer/types.ts";

export function createStopRoomInitialState(
  hostPlayerId: string,
  hostPlayerName: string,
  now = Date.now(),
) {
  return createStopMultiplayerInitialState(
    {
      id: hostPlayerId,
      name: hostPlayerName,
    },
    now,
  );
}

export function addStopRoomPlayer(
  state: ReturnType<typeof createStopRoomInitialState>,
  playerId: string,
  playerName: string,
  now = Date.now(),
): StopMultiplayerLogicResult {
  return addStopMultiplayerPlayer(
    state,
    {
      id: playerId,
      name: playerName,
    },
    now,
  );
}

export function removeStopRoomPlayer(
  state: ReturnType<typeof createStopRoomInitialState>,
  playerId: string,
  now = Date.now(),
): StopMultiplayerLogicResult {
  return removeStopMultiplayerPlayer(state, playerId, now);
}

export function markStopRoomPlayerConnection(
  state: ReturnType<typeof createStopRoomInitialState>,
  playerId: string,
  connected: boolean,
  now = Date.now(),
): StopMultiplayerLogicResult {
  return markStopMultiplayerPlayerConnection(state, playerId, connected, now);
}

export function updateStopRoomSettings(
  state: ReturnType<typeof createStopRoomInitialState>,
  actorPlayerId: string,
  settingsPatch: StopMultiplayerSettingsPatch,
  now = Date.now(),
): StopMultiplayerLogicResult {
  return updateStopMultiplayerSettings(state, actorPlayerId, settingsPatch, now);
}

export function startStopRoomMatch(
  state: ReturnType<typeof createStopRoomInitialState>,
  actorPlayerId: string,
  now = Date.now(),
): StopMultiplayerLogicResult {
  return startStopMultiplayerMatch(state, actorPlayerId, now);
}

export function resolveStopRoomRoundLock(
  state: ReturnType<typeof createStopRoomInitialState>,
  answersByPlayerId: Record<string, readonly string[]>,
  stoppedByPlayerId: string | null,
  now = Date.now(),
) {
  return resolveStopMultiplayerRoundLock(
    state,
    answersByPlayerId,
    stoppedByPlayerId,
    now,
  );
}

export function moveStopRoomToResults(
  state: ReturnType<typeof createStopRoomInitialState>,
  now = Date.now(),
) {
  return moveStopMultiplayerRoundToResults(state, now);
}

export function moveStopRoomToPlaying(
  state: ReturnType<typeof createStopRoomInitialState>,
  now = Date.now(),
) {
  return moveStopMultiplayerRoundToPlaying(state, now);
}

export function archiveStopRoomCurrentRound(
  state: ReturnType<typeof createStopRoomInitialState>,
  now = Date.now(),
) {
  return archiveCurrentStopMultiplayerRound(state, now);
}

export function advanceStopRoomRound(
  state: ReturnType<typeof createStopRoomInitialState>,
  now = Date.now(),
) {
  return advanceStopMultiplayerRound(state, now);
}

export function addStopRoomRematchVote(
  state: ReturnType<typeof createStopRoomInitialState>,
  actorPlayerId: string,
  now = Date.now(),
): StopMultiplayerLogicResult {
  return addStopMultiplayerRematchVote(state, actorPlayerId, now);
}

export function restartStopRoomMatch(
  state: ReturnType<typeof createStopRoomInitialState>,
  now = Date.now(),
) {
  return restartStopMultiplayerMatch(state, now);
}
