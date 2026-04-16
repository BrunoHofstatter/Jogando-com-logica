import type { DifficultyKey } from "../gameConfig";
import type { StopRound, StopRoundResult } from "../stopRound";

export const STOP_MULTIPLAYER_MAX_PLAYERS = 8;
export const STOP_MULTIPLAYER_MIN_PLAYERS = 2;
export const STOP_MULTIPLAYER_MAX_ROUNDS = 10;
export const STOP_MULTIPLAYER_DEFAULT_SAFETY_TIME_SECONDS = 120;
export const STOP_MULTIPLAYER_LOCK_DURATION_MS = 1800;
export const STOP_MULTIPLAYER_RESULTS_DURATION_MS = 7000;
export const STOP_MULTIPLAYER_PRE_ROUND_DURATION_MS =
  STOP_MULTIPLAYER_RESULTS_DURATION_MS;

export interface StopMultiplayerSettings {
  difficulty: DifficultyKey;
  progressiveDifficulty: boolean;
  roundCount: number;
  playerLimit: number;
}

export type StopMultiplayerSettingsPatch = Partial<StopMultiplayerSettings>;

export interface StopMultiplayerPlayer {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  totalScore: number;
  joinedAt: number;
}

export type StopMultiplayerStatus = "lobby" | "playing" | "ended";
export type StopMultiplayerRoundPhase =
  | "countdown"
  | "playing"
  | "locked"
  | "results";

export interface StopMultiplayerRoundState {
  roundNumber: number;
  difficulty: DifficultyKey;
  phase: StopMultiplayerRoundPhase;
  round: StopRound;
  startedAt: number;
  safetyEndsAt: number;
  phaseEndsAt: number;
  stoppedByPlayerId: string | null;
  lockedAt: number | null;
  resultsByPlayerId: Record<string, StopRoundResult>;
}

export interface StopMultiplayerCompletedRoundState {
  roundNumber: number;
  difficulty: DifficultyKey;
  round: StopRound;
  stoppedByPlayerId: string | null;
  resultsByPlayerId: Record<string, StopRoundResult>;
  startedAt: number;
  lockedAt: number | null;
}

export interface StopMultiplayerState {
  status: StopMultiplayerStatus;
  settings: StopMultiplayerSettings;
  players: StopMultiplayerPlayer[];
  hostPlayerId: string;
  currentRoundNumber: number;
  currentRound: StopMultiplayerRoundState | null;
  completedRounds: StopMultiplayerCompletedRoundState[];
  winnerPlayerIds: string[];
  rematchPlayerIds: string[];
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_STOP_MULTIPLAYER_SETTINGS: StopMultiplayerSettings = {
  difficulty: "d2",
  progressiveDifficulty: false,
  roundCount: 5,
  playerLimit: STOP_MULTIPLAYER_MAX_PLAYERS,
};

export const STOP_MULTIPLAYER_DIFFICULTY_ORDER: DifficultyKey[] = [
  "d1",
  "d2",
  "d3",
  "d4",
  "d5",
  "d6",
];
