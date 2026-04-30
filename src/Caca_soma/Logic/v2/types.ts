export type TeamId = 0 | 1;

export type DifficultyId = "easy" | "medium" | "hard";

export type CacaSomaMatchStatus = "playing" | "ended";

export type CacaSomaEndReason = "target_score" | "board_exhausted";

export type CacaSomaTargetStrategy = "shared" | "fallback_distinct";

export type CacaSomaRoundResultReason =
  | "one_correct"
  | "faster_correct"
  | "tied_correct"
  | "no_correct";

export type CacaSomaActionFailureReason =
  | "game_ended"
  | "round_expired"
  | "invalid_team"
  | "invalid_player"
  | "team_already_submitted"
  | "invalid_cell"
  | "duplicate_selection"
  | "selection_limit_exceeded"
  | "team_selection_limit_exceeded"
  | "cell_locked"
  | "cell_owned_by_teammate"
  | "cooldown_active";

export interface CacaSomaTargetRange {
  min: number;
  max: number;
}

export interface CacaSomaDifficultyConfig {
  id: DifficultyId;
  boardSize: 5 | 7 | 10;
  maxCellValue: number;
  roundTimeLimitMs: number;
  targetRange: CacaSomaTargetRange | null;
}

export interface CreatePointsRaceConfigOptions {
  difficultyId: DifficultyId;
  targetScore: number;
  teamSize: 1 | 2;
  selectionChangeCooldownMs?: number;
  timePrecisionMs?: number;
  preferSharedTargets?: boolean;
}

export interface CacaSomaMatchConfig {
  difficulty: CacaSomaDifficultyConfig;
  targetScore: number;
  teamSize: 1 | 2;
  requiredSelections: number;
  selectionLimits: number[];
  selectionChangeCooldownMs: number;
  timePrecisionMs: number;
  preferSharedTargets: boolean;
}

export interface CacaSomaPlayerState {
  selectedCellIds: number[];
  ready: boolean;
  lastSelectionChangeAtMs: number | null;
}

export interface CacaSomaTeamState {
  score: number;
  lockedCellIds: number[];
  players: CacaSomaPlayerState[];
}

export interface CacaSomaTeamSubmission {
  team: TeamId;
  target: number;
  submittedAtMs: number;
  elapsedMs: number;
  roundedElapsedUnits: number;
  selectedCellIds: number[];
  selectedValues: number[];
  sum: number;
  correct: boolean;
}

export interface CacaSomaRoundTargets {
  targetNumbers: [number, number];
  targetStrategy: CacaSomaTargetStrategy;
}

export interface CacaSomaRoundState extends CacaSomaRoundTargets {
  number: number;
  startedAtMs: number;
  deadlineAtMs: number;
  submissions: [CacaSomaTeamSubmission | null, CacaSomaTeamSubmission | null];
}

export interface CacaSomaRoundTeamResult {
  target: number;
  submitted: boolean;
  submittedAtMs: number | null;
  elapsedMs: number | null;
  roundedElapsedUnits: number | null;
  selectedCellIds: number[];
  selectedValues: number[];
  sum: number | null;
  correct: boolean;
}

export interface CacaSomaRoundResult extends CacaSomaRoundTargets {
  roundNumber: number;
  winner: TeamId | null;
  reason: CacaSomaRoundResultReason;
  teams: [CacaSomaRoundTeamResult, CacaSomaRoundTeamResult];
}

export interface CacaSomaMatchState {
  config: CacaSomaMatchConfig;
  status: CacaSomaMatchStatus;
  winner: TeamId | null;
  endReason: CacaSomaEndReason | null;
  boardValues: number[];
  teams: [CacaSomaTeamState, CacaSomaTeamState];
  currentRound: CacaSomaRoundState | null;
  history: CacaSomaRoundResult[];
}

export type SetPlayerSelectionAction = {
  type: "set_player_selection";
  team: TeamId;
  playerIndex: number;
  cellIds: readonly number[];
  nowMs: number;
};

export type SetPlayerReadyAction = {
  type: "set_player_ready";
  team: TeamId;
  playerIndex: number;
  ready: boolean;
  nowMs: number;
};

export type CacaSomaPlayerAction =
  | SetPlayerSelectionAction
  | SetPlayerReadyAction;

export type CacaSomaEvent =
  | {
      type: "selection_changed";
      team: TeamId;
      playerIndex: number;
      cellIds: number[];
      values: number[];
      readyCleared: boolean;
    }
  | {
      type: "ready_changed";
      team: TeamId;
      playerIndex: number;
      ready: boolean;
    }
  | {
      type: "team_submitted";
      team: TeamId;
      correct: boolean;
      sum: number;
      elapsedMs: number;
      target: number;
    }
  | {
      type: "round_resolved";
      roundNumber: number;
      winner: TeamId | null;
      reason: CacaSomaRoundResultReason;
    }
  | {
      type: "point_scored";
      team: TeamId;
      score: number;
    }
  | {
      type: "round_started";
      roundNumber: number;
      targetNumbers: [number, number];
      targetStrategy: CacaSomaTargetStrategy;
      deadlineAtMs: number;
    }
  | {
      type: "match_ended";
      winner: TeamId | null;
      reason: CacaSomaEndReason;
    };

export type ApplyPlayerActionResult =
  | {
      ok: true;
      state: CacaSomaMatchState;
      events: CacaSomaEvent[];
    }
  | {
      ok: false;
      reason: CacaSomaActionFailureReason;
      remainingCooldownMs?: number;
    };

export interface ExpireRoundResult {
  state: CacaSomaMatchState;
  events: CacaSomaEvent[];
  changed: boolean;
}
