import { getFilteredPossibleSums } from "../gameLogic";
import type {
  ApplyPlayerActionResult,
  CacaSomaEvent,
  CacaSomaMatchConfig,
  CacaSomaMatchState,
  CacaSomaPlayerAction,
  CacaSomaPlayerState,
  CacaSomaRoundResult,
  CacaSomaRoundResultReason,
  CacaSomaRoundState,
  CacaSomaRoundTargets,
  CacaSomaTeamState,
  CacaSomaTeamSubmission,
  CreatePointsRaceConfigOptions,
  DifficultyId,
  ExpireRoundResult,
  TeamId,
} from "./types";

const BOARD_SIZE_BY_DIFFICULTY: Record<DifficultyId, 5 | 7 | 10> = {
  easy: 5,
  medium: 7,
  hard: 10,
};

const MAX_CELL_VALUE_BY_DIFFICULTY: Record<DifficultyId, number> = {
  easy: 30,
  medium: 50,
  hard: 120,
};

const ROUND_TIME_MS_BY_DIFFICULTY: Record<DifficultyId, number> = {
  easy: 60_000,
  medium: 90_000,
  hard: 120_000,
};

export function createPointsRaceConfig(
  options: CreatePointsRaceConfigOptions,
): CacaSomaMatchConfig {
  const {
    difficultyId,
    targetScore,
    teamSize,
    selectionChangeCooldownMs = 1_000,
    timePrecisionMs = 10,
    preferSharedTargets = true,
  } = options;

  if (!Number.isInteger(targetScore) || targetScore < 1) {
    throw new Error("targetScore must be an integer greater than zero.");
  }

  if (selectionChangeCooldownMs < 0) {
    throw new Error("selectionChangeCooldownMs cannot be negative.");
  }

  if (!Number.isInteger(timePrecisionMs) || timePrecisionMs <= 0) {
    throw new Error("timePrecisionMs must be a positive integer.");
  }

  const requiredSelections = teamSize === 1
    ? difficultyId === "easy"
      ? 2
      : 3
    : 2;

  return {
    difficulty: {
      id: difficultyId,
      boardSize: BOARD_SIZE_BY_DIFFICULTY[difficultyId],
      maxCellValue: MAX_CELL_VALUE_BY_DIFFICULTY[difficultyId],
      roundTimeLimitMs: ROUND_TIME_MS_BY_DIFFICULTY[difficultyId],
      targetRange: null,
    },
    targetScore,
    teamSize,
    requiredSelections,
    selectionLimits:
      teamSize === 1 ? [requiredSelections] : Array.from({ length: teamSize }, () => 1),
    selectionChangeCooldownMs,
    timePrecisionMs,
    preferSharedTargets,
  };
}

export function createInitialState(
  config: CacaSomaMatchConfig,
  nowMs: number,
  random: () => number = Math.random,
  boardValuesOverride?: readonly number[],
): CacaSomaMatchState {
  validateConfig(config);

  const teams = createInitialTeams(config);
  const boardValues = boardValuesOverride
    ? normalizeBoardValues(config, boardValuesOverride)
    : createBoardValues(config, random);
  const roundTargets = generateRoundTargets(teams, config, boardValues, random);

  if (!roundTargets) {
    return {
      config,
      status: "ended",
      winner: null,
      endReason: "board_exhausted",
      boardValues,
      teams,
      currentRound: null,
      history: [],
    };
  }

  return {
    config,
    status: "playing",
    winner: null,
    endReason: null,
    boardValues,
    teams,
    currentRound: createRoundState(roundTargets, 1, config, nowMs),
    history: [],
  };
}

export function generateRoundTargets(
  teams: readonly [CacaSomaTeamState, CacaSomaTeamState],
  config: CacaSomaMatchConfig,
  boardValues: readonly number[],
  random: () => number = Math.random,
): CacaSomaRoundTargets | null {
  const teamCandidates = teams.map((team) =>
    getCandidateTargetsForTeam(team, config, boardValues),
  ) as [number[], number[]];

  if (teamCandidates[0].length === 0 || teamCandidates[1].length === 0) {
    return null;
  }

  const sharedCandidates = teamCandidates[0].filter((candidate) =>
    teamCandidates[1].includes(candidate),
  );

  if (sharedCandidates.length > 0) {
    const sharedTarget = pickRandom(sharedCandidates, random);
    return {
      targetNumbers: [sharedTarget, sharedTarget],
      targetStrategy: "shared",
    };
  }

  if (!config.preferSharedTargets) {
    return {
      targetNumbers: [
        pickRandom(teamCandidates[0], random),
        pickRandom(teamCandidates[1], random),
      ],
      targetStrategy: "fallback_distinct",
    };
  }

  return {
    targetNumbers: [
      pickRandom(teamCandidates[0], random),
      pickRandom(teamCandidates[1], random),
    ],
    targetStrategy: "fallback_distinct",
  };
}

export function applyPlayerAction(
  state: CacaSomaMatchState,
  action: CacaSomaPlayerAction,
  random: () => number = Math.random,
): ApplyPlayerActionResult {
  if (state.status === "ended") {
    return {
      ok: false,
      reason: "game_ended",
    };
  }

  if (!state.currentRound || action.nowMs >= state.currentRound.deadlineAtMs) {
    return {
      ok: false,
      reason: "round_expired",
    };
  }

  if (!isTeamId(action.team)) {
    return {
      ok: false,
      reason: "invalid_team",
    };
  }

  const teamState = state.teams[action.team];
  if (action.playerIndex < 0 || action.playerIndex >= teamState.players.length) {
    return {
      ok: false,
      reason: "invalid_player",
    };
  }

  if (state.currentRound.submissions[action.team] !== null) {
    return {
      ok: false,
      reason: "team_already_submitted",
    };
  }

  if (action.type === "set_player_selection") {
    return applySelectionAction(state, action);
  }

  return applyReadyAction(state, action, random);
}

export function expireRound(
  state: CacaSomaMatchState,
  nowMs: number,
  random: () => number = Math.random,
): ExpireRoundResult {
  if (state.status === "ended" || !state.currentRound) {
    return {
      state,
      events: [],
      changed: false,
    };
  }

  if (nowMs < state.currentRound.deadlineAtMs) {
    return {
      state,
      events: [],
      changed: false,
    };
  }

  return {
    ...resolveRound(state, random),
    changed: true,
  };
}

export function getTeamSelectionSum(
  teamState: CacaSomaTeamState,
  boardValues: readonly number[],
): number {
  return flattenSelections(teamState.players).reduce(
    (total, cellId) => total + getCellValue(boardValues, cellId),
    0,
  );
}

export function getAvailableNumbersForTeam(
  teamState: CacaSomaTeamState,
  boardValues: readonly number[],
): number[] {
  const locked = new Set(teamState.lockedCellIds);
  const available: number[] = [];

  for (let cellId = 0; cellId < boardValues.length; cellId += 1) {
    if (!locked.has(cellId)) {
      available.push(getCellValue(boardValues, cellId));
    }
  }

  return available;
}

function applySelectionAction(
  state: CacaSomaMatchState,
  action: Extract<CacaSomaPlayerAction, { type: "set_player_selection" }>,
): ApplyPlayerActionResult {
  const config = state.config;
  const boardCellCount = config.difficulty.boardSize * config.difficulty.boardSize;
  const teamState = state.teams[action.team];
  const playerState = teamState.players[action.playerIndex];
  const normalizedCellIds = normalizeCellIds(action.cellIds);

  if (!normalizedCellIds) {
    return {
      ok: false,
      reason: "duplicate_selection",
    };
  }

  if (normalizedCellIds.length > config.selectionLimits[action.playerIndex]) {
    return {
      ok: false,
      reason: "selection_limit_exceeded",
    };
  }

  const cooldownRemaining = getCooldownRemainingMs(
    playerState,
    normalizedCellIds,
    action.nowMs,
    config.selectionChangeCooldownMs,
  );
  if (cooldownRemaining > 0) {
    return {
      ok: false,
      reason: "cooldown_active",
      remainingCooldownMs: cooldownRemaining,
    };
  }

  const lockedCellIds = new Set(teamState.lockedCellIds);
  const teammateCellIds = new Set(
    teamState.players.flatMap((teamPlayer, index) =>
      index === action.playerIndex ? [] : teamPlayer.selectedCellIds,
    ),
  );

  for (const cellId of normalizedCellIds) {
    if (!Number.isInteger(cellId) || cellId < 0 || cellId >= boardCellCount) {
      return {
        ok: false,
        reason: "invalid_cell",
      };
    }

    if (lockedCellIds.has(cellId)) {
      return {
        ok: false,
        reason: "cell_locked",
      };
    }

    if (teammateCellIds.has(cellId)) {
      return {
        ok: false,
        reason: "cell_owned_by_teammate",
      };
    }
  }

  const previousSelection = playerState.selectedCellIds;
  if (areNumberArraysEqual(previousSelection, normalizedCellIds)) {
    return {
      ok: true,
      state,
      events: [],
    };
  }

  const nextPlayers = teamState.players.map((teamPlayer, index) => {
    if (index !== action.playerIndex) {
      return clonePlayerState(teamPlayer);
    }

    return {
      selectedCellIds: [...normalizedCellIds],
      ready: false,
      lastSelectionChangeAtMs: action.nowMs,
    };
  }) as CacaSomaPlayerState[];

  if (flattenSelections(nextPlayers).length > config.requiredSelections) {
    return {
      ok: false,
      reason: "team_selection_limit_exceeded",
    };
  }

  const readyCleared = playerState.ready;
  const nextTeamState: CacaSomaTeamState = {
    ...teamState,
    players: nextPlayers,
  };
  const events: CacaSomaEvent[] = [
    {
      type: "selection_changed",
      team: action.team,
      playerIndex: action.playerIndex,
      cellIds: [...normalizedCellIds],
      values: normalizedCellIds.map((cellId) => getCellValue(state.boardValues, cellId)),
      readyCleared,
    },
  ];

  if (readyCleared) {
    events.push({
      type: "ready_changed",
      team: action.team,
      playerIndex: action.playerIndex,
      ready: false,
    });
  }

  return {
    ok: true,
    state: replaceTeamState(state, action.team, nextTeamState),
    events,
  };
}

function applyReadyAction(
  state: CacaSomaMatchState,
  action: Extract<CacaSomaPlayerAction, { type: "set_player_ready" }>,
  random: () => number,
): ApplyPlayerActionResult {
  const teamState = state.teams[action.team];
  const playerState = teamState.players[action.playerIndex];

  if (playerState.ready === action.ready) {
    return {
      ok: true,
      state,
      events: [],
    };
  }

  const nextPlayers = teamState.players.map((teamPlayer, index) =>
    index === action.playerIndex
      ? {
          ...clonePlayerState(teamPlayer),
          ready: action.ready,
        }
      : clonePlayerState(teamPlayer),
  ) as CacaSomaPlayerState[];

  const nextTeamState: CacaSomaTeamState = {
    ...teamState,
    players: nextPlayers,
  };

  let nextState = replaceTeamState(state, action.team, nextTeamState);
  const events: CacaSomaEvent[] = [
    {
      type: "ready_changed",
      team: action.team,
      playerIndex: action.playerIndex,
      ready: action.ready,
    },
  ];

  if (canSubmitTeam(nextTeamState, state.config.requiredSelections)) {
    const submission = createSubmission(
      nextState.currentRound as CacaSomaRoundState,
      nextState.boardValues,
      nextTeamState,
      action.team,
      state.config,
      action.nowMs,
    );
    nextState = replaceSubmission(nextState, action.team, submission);
    events.push({
      type: "team_submitted",
      team: action.team,
      correct: submission.correct,
      sum: submission.sum,
      elapsedMs: submission.elapsedMs,
      target: submission.target,
    });

    if (nextState.currentRound?.submissions.every((roundSubmission) => roundSubmission !== null)) {
      const resolved = resolveRound(nextState, random);
      return {
        ok: true,
        state: resolved.state,
        events: [...events, ...resolved.events],
      };
    }
  }

  return {
    ok: true,
    state: nextState,
    events,
  };
}

function resolveRound(
  state: CacaSomaMatchState,
  random: () => number,
): {
  state: CacaSomaMatchState;
  events: CacaSomaEvent[];
} {
  const currentRound = state.currentRound;
  if (!currentRound) {
    return {
      state,
      events: [],
    };
  }

  const events: CacaSomaEvent[] = [];
  const roundTeams = buildRoundTeams(currentRound);
  const { winner, reason } = resolveRoundWinner(roundTeams);
  const nextTeams = applyCorrectLocks(state.teams, currentRound);
  const historyEntry: CacaSomaRoundResult = {
    roundNumber: currentRound.number,
    targetNumbers: [...currentRound.targetNumbers] as [number, number],
    targetStrategy: currentRound.targetStrategy,
    winner,
    reason,
    teams: roundTeams,
  };

  events.push({
    type: "round_resolved",
    roundNumber: currentRound.number,
    winner,
    reason,
  });

  if (winner !== null) {
    nextTeams[winner] = {
      ...nextTeams[winner],
      score: nextTeams[winner].score + 1,
    };
    events.push({
      type: "point_scored",
      team: winner,
      score: nextTeams[winner].score,
    });
  }

  if (winner !== null && nextTeams[winner].score >= state.config.targetScore) {
    const endedState: CacaSomaMatchState = {
      ...state,
      status: "ended",
      winner,
      endReason: "target_score",
      teams: nextTeams,
      currentRound: null,
      history: [...state.history, historyEntry],
    };
    events.push({
      type: "match_ended",
      winner,
      reason: "target_score",
    });
    return {
      state: endedState,
      events,
    };
  }

  const nextRoundTargets = generateRoundTargets(nextTeams, state.config, state.boardValues, random);
  if (!nextRoundTargets) {
    const exhaustionWinner = getScoreLeader(nextTeams);
    const endedState: CacaSomaMatchState = {
      ...state,
      status: "ended",
      winner: exhaustionWinner,
      endReason: "board_exhausted",
      teams: nextTeams,
      currentRound: null,
      history: [...state.history, historyEntry],
    };
    events.push({
      type: "match_ended",
      winner: exhaustionWinner,
      reason: "board_exhausted",
    });
    return {
      state: endedState,
      events,
    };
  }

  const nextRound = createRoundState(
    nextRoundTargets,
    currentRound.number + 1,
    state.config,
    currentRound.deadlineAtMs,
  );
  events.push({
    type: "round_started",
    roundNumber: nextRound.number,
    targetNumbers: [...nextRound.targetNumbers] as [number, number],
    targetStrategy: nextRound.targetStrategy,
    deadlineAtMs: nextRound.deadlineAtMs,
  });

  return {
    state: {
      ...state,
      teams: nextTeams,
      currentRound: nextRound,
      history: [...state.history, historyEntry],
    },
    events,
  };
}

function validateConfig(config: CacaSomaMatchConfig): void {
  if (config.teamSize !== 1 && config.teamSize !== 2) {
    throw new Error("Only team sizes 1 and 2 are currently supported.");
  }

  if (
    !Number.isInteger(config.difficulty.maxCellValue) ||
    config.difficulty.maxCellValue < config.difficulty.boardSize * config.difficulty.boardSize
  ) {
    throw new Error("difficulty.maxCellValue must be at least the board cell count.");
  }

  if (config.selectionLimits.length !== config.teamSize) {
    throw new Error("selectionLimits must have one entry per player.");
  }

  const totalSelectionCapacity = config.selectionLimits.reduce(
    (total, selectionLimit) => total + selectionLimit,
    0,
  );

  if (totalSelectionCapacity < config.requiredSelections) {
    throw new Error("selectionLimits must allow the team to reach requiredSelections.");
  }
}

function createInitialTeams(config: CacaSomaMatchConfig): [CacaSomaTeamState, CacaSomaTeamState] {
  const createPlayers = (): CacaSomaPlayerState[] =>
    Array.from({ length: config.teamSize }, () => ({
      selectedCellIds: [],
      ready: false,
      lastSelectionChangeAtMs: null,
    }));

  return [
    {
      score: 0,
      lockedCellIds: [],
      players: createPlayers(),
    },
    {
      score: 0,
      lockedCellIds: [],
      players: createPlayers(),
    },
  ];
}

function createBoardValues(
  config: CacaSomaMatchConfig,
  random: () => number,
): number[] {
  const totalCells = config.difficulty.boardSize * config.difficulty.boardSize;
  const valuePool = Array.from(
    { length: config.difficulty.maxCellValue },
    (_, index) => index + 1,
  );

  shuffleInPlace(valuePool, random);
  return valuePool.slice(0, totalCells);
}

function normalizeBoardValues(
  config: CacaSomaMatchConfig,
  boardValues: readonly number[],
): number[] {
  const expectedCellCount = config.difficulty.boardSize * config.difficulty.boardSize;

  if (boardValues.length !== expectedCellCount) {
    throw new Error("boardValues length must match the board cell count.");
  }

  return boardValues.map((value) => {
    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value > config.difficulty.maxCellValue
    ) {
      throw new Error("boardValues contains an invalid cell value.");
    }

    return value;
  });
}

function getCandidateTargetsForTeam(
  team: CacaSomaTeamState,
  config: CacaSomaMatchConfig,
  boardValues: readonly number[],
): number[] {
  const availableNumbers = getAvailableNumbersForTeam(
    team,
    boardValues,
  );

  if (availableNumbers.length < config.requiredSelections) {
    return [];
  }

  const range = config.difficulty.targetRange
    ? [config.difficulty.targetRange.min, config.difficulty.targetRange.max] as [number, number]
    : null;

  return getFilteredPossibleSums(
    availableNumbers,
    config.requiredSelections,
    range,
  );
}

function createRoundState(
  targets: CacaSomaRoundTargets,
  roundNumber: number,
  config: CacaSomaMatchConfig,
  startedAtMs: number,
): CacaSomaRoundState {
  return {
    ...targets,
    number: roundNumber,
    startedAtMs,
    deadlineAtMs: startedAtMs + config.difficulty.roundTimeLimitMs,
    submissions: [null, null],
  };
}

function createSubmission(
  currentRound: CacaSomaRoundState,
  boardValues: readonly number[],
  teamState: CacaSomaTeamState,
  team: TeamId,
  config: CacaSomaMatchConfig,
  submittedAtMs: number,
): CacaSomaTeamSubmission {
  const selectedCellIds = flattenSelections(teamState.players);
  const selectedValues = selectedCellIds.map((cellId) =>
    getCellValue(boardValues, cellId),
  );
  const sum = selectedValues.reduce((total, value) => total + value, 0);
  const elapsedMs = Math.max(0, submittedAtMs - currentRound.startedAtMs);

  return {
    team,
    target: currentRound.targetNumbers[team],
    submittedAtMs,
    elapsedMs,
    roundedElapsedUnits: toRoundedTimeUnits(elapsedMs, config.timePrecisionMs),
    selectedCellIds,
    selectedValues,
    sum,
    correct: sum === currentRound.targetNumbers[team],
  };
}

function resolveRoundWinner(
  teams: CacaSomaRoundResult["teams"],
): {
  winner: TeamId | null;
  reason: CacaSomaRoundResultReason;
} {
  const correctTeams = teams
    .map((team, teamIndex) => ({ team, teamIndex: teamIndex as TeamId }))
    .filter(({ team }) => team.correct);

  if (correctTeams.length === 1) {
    return {
      winner: correctTeams[0].teamIndex,
      reason: "one_correct",
    };
  }

  if (correctTeams.length === 2) {
    const [firstTeam, secondTeam] = correctTeams;
    const firstTime = firstTeam.team.roundedElapsedUnits ?? Number.POSITIVE_INFINITY;
    const secondTime = secondTeam.team.roundedElapsedUnits ?? Number.POSITIVE_INFINITY;

    if (firstTime === secondTime) {
      return {
        winner: null,
        reason: "tied_correct",
      };
    }

    return {
      winner: firstTime < secondTime ? firstTeam.teamIndex : secondTeam.teamIndex,
      reason: "faster_correct",
    };
  }

  return {
    winner: null,
    reason: "no_correct",
  };
}

function buildRoundTeams(
  currentRound: CacaSomaRoundState,
): CacaSomaRoundResult["teams"] {
  return [0, 1].map((teamId) => {
    const submission = currentRound.submissions[teamId as TeamId];
    return {
      target: currentRound.targetNumbers[teamId as TeamId],
      submitted: submission !== null,
      submittedAtMs: submission?.submittedAtMs ?? null,
      elapsedMs: submission?.elapsedMs ?? null,
      roundedElapsedUnits: submission?.roundedElapsedUnits ?? null,
      selectedCellIds: submission ? [...submission.selectedCellIds] : [],
      selectedValues: submission ? [...submission.selectedValues] : [],
      sum: submission?.sum ?? null,
      correct: submission?.correct ?? false,
    };
  }) as CacaSomaRoundResult["teams"];
}

function applyCorrectLocks(
  teams: readonly [CacaSomaTeamState, CacaSomaTeamState],
  currentRound: CacaSomaRoundState,
): [CacaSomaTeamState, CacaSomaTeamState] {
  const buildNextTeam = (teamState: CacaSomaTeamState, teamIndex: TeamId): CacaSomaTeamState => {
    const submission = currentRound.submissions[teamIndex as TeamId];
    const lockedCellIds = submission?.correct
      ? mergeLockedCellIds(teamState.lockedCellIds, submission.selectedCellIds)
      : [...teamState.lockedCellIds];

    return {
      score: teamState.score,
      lockedCellIds,
      players: teamState.players.map(() => ({
        selectedCellIds: [],
        ready: false,
        lastSelectionChangeAtMs: null,
      })),
    };
  };

  return [
    buildNextTeam(teams[0], 0),
    buildNextTeam(teams[1], 1),
  ];
}

function canSubmitTeam(
  teamState: CacaSomaTeamState,
  requiredSelections: number,
): boolean {
  return (
    teamState.players.every((player) => player.ready) &&
    flattenSelections(teamState.players).length === requiredSelections
  );
}

function replaceTeamState(
  state: CacaSomaMatchState,
  team: TeamId,
  teamState: CacaSomaTeamState,
): CacaSomaMatchState {
  const nextTeams = state.teams.map((currentTeamState, index) =>
    index === team ? teamState : cloneTeamState(currentTeamState),
  ) as [CacaSomaTeamState, CacaSomaTeamState];

  return {
    ...state,
    teams: nextTeams,
  };
}

function replaceSubmission(
  state: CacaSomaMatchState,
  team: TeamId,
  submission: CacaSomaTeamSubmission,
): CacaSomaMatchState {
  if (!state.currentRound) {
    return state;
  }

  const submissions = state.currentRound.submissions.map((currentSubmission, index) =>
    index === team ? submission : currentSubmission,
  ) as [CacaSomaTeamSubmission | null, CacaSomaTeamSubmission | null];

  return {
    ...state,
    currentRound: {
      ...state.currentRound,
      submissions,
    },
  };
}

function getCooldownRemainingMs(
  playerState: CacaSomaPlayerState,
  nextCellIds: number[],
  nowMs: number,
  cooldownMs: number,
): number {
  if (cooldownMs <= 0 || playerState.lastSelectionChangeAtMs === null) {
    return 0;
  }

  if (areNumberArraysEqual(playerState.selectedCellIds, nextCellIds)) {
    return 0;
  }

  return Math.max(
    0,
    playerState.lastSelectionChangeAtMs + cooldownMs - nowMs,
  );
}

function flattenSelections(players: readonly CacaSomaPlayerState[]): number[] {
  return players.flatMap((player) => player.selectedCellIds);
}

function getScoreLeader(
  teams: readonly [CacaSomaTeamState, CacaSomaTeamState],
): TeamId | null {
  if (teams[0].score === teams[1].score) {
    return null;
  }

  return teams[0].score > teams[1].score ? 0 : 1;
}

function mergeLockedCellIds(
  baseLockedCellIds: readonly number[],
  addedLockedCellIds: readonly number[],
): number[] {
  return Array.from(new Set([...baseLockedCellIds, ...addedLockedCellIds])).sort(
    (left, right) => left - right,
  );
}

function normalizeCellIds(cellIds: readonly number[]): number[] | null {
  const uniqueCellIds = Array.from(new Set(cellIds));
  if (uniqueCellIds.length !== cellIds.length) {
    return null;
  }

  return [...uniqueCellIds].sort((left, right) => left - right);
}

function areNumberArraysEqual(
  left: readonly number[],
  right: readonly number[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function toRoundedTimeUnits(elapsedMs: number, precisionMs: number): number {
  return Math.round(elapsedMs / precisionMs);
}

function getCellValue(boardValues: readonly number[], cellId: number): number {
  return boardValues[cellId] ?? 0;
}

function shuffleInPlace(values: number[], random: () => number): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const rawRandomValue = random();
    const randomValue = Number.isFinite(rawRandomValue) ? rawRandomValue : 0;
    const nextIndex = Math.max(0, Math.min(index, Math.floor(randomValue * (index + 1))));
    const currentValue = values[index];
    values[index] = values[nextIndex];
    values[nextIndex] = currentValue;
  }
}

function pickRandom(values: readonly number[], random: () => number): number {
  const randomValue = random();
  const safeRandom = Number.isFinite(randomValue) ? randomValue : 0;
  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.floor(safeRandom * values.length)),
  );
  return values[index];
}

function isTeamId(team: number): team is TeamId {
  return team === 0 || team === 1;
}

function clonePlayerState(playerState: CacaSomaPlayerState): CacaSomaPlayerState {
  return {
    selectedCellIds: [...playerState.selectedCellIds],
    ready: playerState.ready,
    lastSelectionChangeAtMs: playerState.lastSelectionChangeAtMs,
  };
}

function cloneTeamState(teamState: CacaSomaTeamState): CacaSomaTeamState {
  return {
    score: teamState.score,
    lockedCellIds: [...teamState.lockedCellIds],
    players: teamState.players.map(clonePlayerState),
  };
}
