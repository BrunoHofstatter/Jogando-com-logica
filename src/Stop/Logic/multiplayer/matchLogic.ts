import { difficulties, type DifficultyKey } from "../gameConfig";
import {
  createStopRound,
  createStopRoundTemplateFromDifficulty,
  evaluateStopRound,
  type StopBox,
  type StopRound,
  type StopRoundResult,
} from "../stopRound";
import {
  DEFAULT_STOP_MULTIPLAYER_SETTINGS,
  STOP_MULTIPLAYER_DEFAULT_SAFETY_TIME_SECONDS,
  STOP_MULTIPLAYER_DIFFICULTY_ORDER,
  STOP_MULTIPLAYER_LOCK_DURATION_MS,
  STOP_MULTIPLAYER_MAX_PLAYERS,
  STOP_MULTIPLAYER_MAX_ROUNDS,
  STOP_MULTIPLAYER_MIN_PLAYERS,
  STOP_MULTIPLAYER_PRE_ROUND_DURATION_MS,
  STOP_MULTIPLAYER_RESULTS_DURATION_MS,
  type StopMultiplayerCompletedRoundState,
  type StopMultiplayerPlayer,
  type StopMultiplayerRoundState,
  type StopMultiplayerSettings,
  type StopMultiplayerSettingsPatch,
  type StopMultiplayerState,
} from "./types";

type RandomSource = () => number;

export type StopMultiplayerLogicErrorCode =
  | "room_full"
  | "room_not_joinable"
  | "unauthorized"
  | "host_only"
  | "not_enough_players"
  | "invalid_settings";

type StopMultiplayerLogicSuccess = {
  ok: true;
  state: StopMultiplayerState;
};

type StopMultiplayerLogicFailure = {
  ok: false;
  code: StopMultiplayerLogicErrorCode;
};

export type StopMultiplayerLogicResult =
  | StopMultiplayerLogicSuccess
  | StopMultiplayerLogicFailure;

export function createStopMultiplayerInitialState(
  hostPlayer: Pick<StopMultiplayerPlayer, "id" | "name">,
  now = Date.now(),
  settingsPatch: StopMultiplayerSettingsPatch = {},
): StopMultiplayerState {
  const settings = normalizeStopMultiplayerSettings(settingsPatch);

  return {
    status: "lobby",
    settings,
    players: [
      {
        id: hostPlayer.id,
        name: hostPlayer.name,
        connected: true,
        isHost: true,
        totalScore: 0,
        joinedAt: now,
      },
    ],
    hostPlayerId: hostPlayer.id,
    currentRoundNumber: 0,
    currentRound: null,
    completedRounds: [],
    winnerPlayerIds: [],
    rematchPlayerIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addStopMultiplayerPlayer(
  state: StopMultiplayerState,
  player: Pick<StopMultiplayerPlayer, "id" | "name">,
  now = Date.now(),
): StopMultiplayerLogicResult {
  if (state.status !== "lobby") {
    return { ok: false, code: "room_not_joinable" };
  }

  if (state.players.length >= state.settings.playerLimit) {
    return { ok: false, code: "room_full" };
  }

  return {
    ok: true,
    state: {
      ...state,
      players: [
        ...state.players,
        {
          id: player.id,
          name: player.name,
          connected: true,
          isHost: false,
          totalScore: 0,
          joinedAt: now,
        },
      ],
      updatedAt: now,
    },
  };
}

export function removeStopMultiplayerPlayer(
  state: StopMultiplayerState,
  playerId: string,
  now = Date.now(),
): StopMultiplayerLogicResult {
  const hasPlayer = state.players.some((player) => player.id === playerId);
  if (!hasPlayer) {
    return { ok: false, code: "unauthorized" };
  }

  return {
    ok: true,
    state: {
      ...state,
      players: state.players.filter((player) => player.id !== playerId),
      updatedAt: now,
    },
  };
}

export function markStopMultiplayerPlayerConnection(
  state: StopMultiplayerState,
  playerId: string,
  connected: boolean,
  now = Date.now(),
): StopMultiplayerLogicResult {
  const hasPlayer = state.players.some((player) => player.id === playerId);
  if (!hasPlayer) {
    return { ok: false, code: "unauthorized" };
  }

  return {
    ok: true,
    state: {
      ...state,
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, connected } : player,
      ),
      updatedAt: now,
    },
  };
}

export function updateStopMultiplayerSettings(
  state: StopMultiplayerState,
  actorPlayerId: string,
  patch: StopMultiplayerSettingsPatch,
  now = Date.now(),
): StopMultiplayerLogicResult {
  if (state.status !== "lobby") {
    return { ok: false, code: "room_not_joinable" };
  }

  if (state.hostPlayerId !== actorPlayerId) {
    return { ok: false, code: "host_only" };
  }

  const settings = normalizeStopMultiplayerSettings({
    ...state.settings,
    ...patch,
  });

  if (settings.playerLimit < state.players.length) {
    return { ok: false, code: "invalid_settings" };
  }

  return {
    ok: true,
    state: {
      ...state,
      settings,
      updatedAt: now,
    },
  };
}

export function startStopMultiplayerMatch(
  state: StopMultiplayerState,
  actorPlayerId: string,
  now = Date.now(),
  rng: RandomSource = Math.random,
): StopMultiplayerLogicResult {
  if (state.status !== "lobby") {
    return { ok: false, code: "room_not_joinable" };
  }

  if (state.hostPlayerId !== actorPlayerId) {
    return { ok: false, code: "host_only" };
  }

  if (state.players.length < STOP_MULTIPLAYER_MIN_PLAYERS) {
    return { ok: false, code: "not_enough_players" };
  }

  const nextRound = createNextRoundState(state, 1, now, rng);

  return {
    ok: true,
    state: {
      ...state,
      status: "playing",
      currentRoundNumber: 1,
      currentRound: nextRound,
      completedRounds: [],
      winnerPlayerIds: [],
      rematchPlayerIds: [],
      players: state.players.map((player) => ({
        ...player,
        totalScore: 0,
        connected: true,
      })),
      updatedAt: now,
    },
  };
}

export function resolveStopMultiplayerRoundLock(
  state: StopMultiplayerState,
  answersByPlayerId: Record<string, readonly string[]>,
  stoppedByPlayerId: string | null,
  now = Date.now(),
): StopMultiplayerState {
  if (!state.currentRound) {
    return state;
  }

  const round = state.currentRound.round;
  const resultsByPlayerId = state.players.reduce<Record<string, StopRoundResult>>(
    (results, player) => {
      results[player.id] = evaluateStopRound(
        round,
        normalizeStopAnswerSnapshot(
          answersByPlayerId[player.id] ?? [],
          round.boxes.length,
        ),
      );
      return results;
    },
    {},
  );

  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      totalScore:
        player.totalScore + (resultsByPlayerId[player.id]?.totalPoints ?? 0),
    })),
    currentRound: {
      ...state.currentRound,
      phase: "locked",
      phaseEndsAt: now + STOP_MULTIPLAYER_LOCK_DURATION_MS,
      stoppedByPlayerId,
      lockedAt: now,
      resultsByPlayerId,
    },
    updatedAt: now,
  };
}

export function moveStopMultiplayerRoundToPlaying(
  state: StopMultiplayerState,
  now = Date.now(),
): StopMultiplayerState {
  if (!state.currentRound) {
    return state;
  }

  return {
    ...state,
    currentRound: {
      ...state.currentRound,
      phase: "playing",
      phaseEndsAt: state.currentRound.safetyEndsAt,
      startedAt: now,
      safetyEndsAt:
        now + STOP_MULTIPLAYER_DEFAULT_SAFETY_TIME_SECONDS * 1000,
    },
    updatedAt: now,
  };
}

export function moveStopMultiplayerRoundToResults(
  state: StopMultiplayerState,
  now = Date.now(),
): StopMultiplayerState {
  if (!state.currentRound) {
    return state;
  }

  return {
    ...state,
    currentRound: {
      ...state.currentRound,
      phase: "results",
      phaseEndsAt: now + STOP_MULTIPLAYER_RESULTS_DURATION_MS,
    },
    updatedAt: now,
  };
}

export function archiveCurrentStopMultiplayerRound(
  state: StopMultiplayerState,
  now = Date.now(),
): StopMultiplayerState {
  if (!state.currentRound) {
    return state;
  }

  const archivedRound: StopMultiplayerCompletedRoundState = {
    roundNumber: state.currentRound.roundNumber,
    difficulty: state.currentRound.difficulty,
    round: state.currentRound.round,
    stoppedByPlayerId: state.currentRound.stoppedByPlayerId,
    resultsByPlayerId: state.currentRound.resultsByPlayerId,
    startedAt: state.currentRound.startedAt,
    lockedAt: state.currentRound.lockedAt,
  };

  return {
    ...state,
    currentRound: null,
    completedRounds: [...state.completedRounds, archivedRound],
    updatedAt: now,
  };
}

export function advanceStopMultiplayerRound(
  state: StopMultiplayerState,
  now = Date.now(),
  rng: RandomSource = Math.random,
): StopMultiplayerState {
  const nextRoundNumber = state.currentRoundNumber + 1;
  if (nextRoundNumber > state.settings.roundCount) {
    return finishStopMultiplayerMatch(state, now);
  }

  return {
    ...state,
    status: "playing",
    currentRoundNumber: nextRoundNumber,
    currentRound: createNextRoundState(state, nextRoundNumber, now, rng),
    updatedAt: now,
  };
}

export function finishStopMultiplayerMatch(
  state: StopMultiplayerState,
  now = Date.now(),
): StopMultiplayerState {
  const highestScore = state.players.reduce(
    (currentHigh, player) => Math.max(currentHigh, player.totalScore),
    Number.NEGATIVE_INFINITY,
  );
  const winnerPlayerIds = state.players
    .filter((player) => player.totalScore === highestScore)
    .map((player) => player.id);

  return {
    ...state,
    status: "ended",
    currentRound: null,
    winnerPlayerIds,
    rematchPlayerIds: [],
    updatedAt: now,
  };
}

export function addStopMultiplayerRematchVote(
  state: StopMultiplayerState,
  actorPlayerId: string,
  now = Date.now(),
): StopMultiplayerLogicResult {
  if (state.status !== "ended") {
    return { ok: false, code: "room_not_joinable" };
  }

  const hasPlayer = state.players.some((player) => player.id === actorPlayerId);
  if (!hasPlayer) {
    return { ok: false, code: "unauthorized" };
  }

  if (state.rematchPlayerIds.includes(actorPlayerId)) {
    return {
      ok: true,
      state,
    };
  }

  return {
    ok: true,
    state: {
      ...state,
      rematchPlayerIds: [...state.rematchPlayerIds, actorPlayerId],
      updatedAt: now,
    },
  };
}

export function restartStopMultiplayerMatch(
  state: StopMultiplayerState,
  now = Date.now(),
  rng: RandomSource = Math.random,
): StopMultiplayerState {
  if (state.status !== "ended") {
    return state;
  }

  const nextRound = createNextRoundState(state, 1, now, rng);

  return {
    ...state,
    status: "playing",
    currentRoundNumber: 1,
    currentRound: nextRound,
    completedRounds: [],
    winnerPlayerIds: [],
    rematchPlayerIds: [],
    players: state.players.map((player) => ({
      ...player,
      totalScore: 0,
    })),
    updatedAt: now,
  };
}

export function getStopMultiplayerDifficultyForRound(
  settings: StopMultiplayerSettings,
  roundNumber: number,
): DifficultyKey {
  if (!settings.progressiveDifficulty) {
    return settings.difficulty;
  }

  const startIndex = STOP_MULTIPLAYER_DIFFICULTY_ORDER.indexOf(
    settings.difficulty,
  );
  if (startIndex === -1) {
    return settings.difficulty;
  }

  const nextIndex = Math.min(
    STOP_MULTIPLAYER_DIFFICULTY_ORDER.length - 1,
    startIndex + Math.max(0, roundNumber - 1),
  );
  return STOP_MULTIPLAYER_DIFFICULTY_ORDER[nextIndex];
}

export function normalizeStopMultiplayerSettings(
  patch: StopMultiplayerSettingsPatch = {},
): StopMultiplayerSettings {
  const difficulty = isDifficultyKey(patch.difficulty)
    ? patch.difficulty
    : DEFAULT_STOP_MULTIPLAYER_SETTINGS.difficulty;
  const progressiveDifficulty =
    typeof patch.progressiveDifficulty === "boolean"
      ? patch.progressiveDifficulty
      : DEFAULT_STOP_MULTIPLAYER_SETTINGS.progressiveDifficulty;
  const roundCount = clampInteger(
    patch.roundCount,
    1,
    STOP_MULTIPLAYER_MAX_ROUNDS,
    DEFAULT_STOP_MULTIPLAYER_SETTINGS.roundCount,
  );
  const playerLimit = clampInteger(
    patch.playerLimit,
    STOP_MULTIPLAYER_MIN_PLAYERS,
    STOP_MULTIPLAYER_MAX_PLAYERS,
    DEFAULT_STOP_MULTIPLAYER_SETTINGS.playerLimit,
  );

  return {
    difficulty,
    progressiveDifficulty,
    roundCount,
    playerLimit,
  };
}

export function normalizeStopAnswerSnapshot(
  answers: readonly string[],
  expectedLength: number,
): string[] {
  return Array.from({ length: expectedLength }, (_, index) =>
    typeof answers[index] === "string" ? answers[index] : "",
  );
}

function createNextRoundState(
  state: StopMultiplayerState,
  roundNumber: number,
  now: number,
  rng: RandomSource,
): StopMultiplayerRoundState {
  const difficulty = getStopMultiplayerDifficultyForRound(
    state.settings,
    roundNumber,
  );
  const roundTemplate = createStopRoundTemplateFromDifficulty(difficulty);
  const rawRound = createStopRound(roundTemplate, rng);
  const round = applyStopMultiplayerPointWeights(rawRound);
  const startedAt = now + STOP_MULTIPLAYER_PRE_ROUND_DURATION_MS;
  const safetyEndsAt =
    startedAt + STOP_MULTIPLAYER_DEFAULT_SAFETY_TIME_SECONDS * 1000;

  return {
    roundNumber,
    difficulty,
    phase: "countdown",
    round,
    startedAt,
    safetyEndsAt,
    phaseEndsAt: startedAt,
    stoppedByPlayerId: null,
    lockedAt: null,
    resultsByPlayerId: {},
  };
}

function applyStopMultiplayerPointWeights(round: StopRound): StopRound {
  return {
    ...round,
    boxes: round.boxes.map((box) => ({
      ...box,
      points: getStopMultiplayerBoxPoints(box),
    })),
  };
}

function getStopMultiplayerBoxPoints(box: StopBox): number {
  if (box.kind === "single") {
    return box.operation === "+" || box.operation === "-" ? 2 : 3;
  }

  return box.operations.some(
    (operation) => operation === "x" || isDivisionOperation(operation),
  )
    ? 4
    : 3;
}

function isDifficultyKey(value: unknown): value is DifficultyKey {
  return typeof value === "string" && value in difficulties;
}

function isDivisionOperation(operation: string): boolean {
  return operation === "\u00f7" || operation === "Ã·";
}

function clampInteger(
  value: number | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
