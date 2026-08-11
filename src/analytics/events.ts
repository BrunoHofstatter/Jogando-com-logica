import { sendAnalyticsEvent } from "./analytics";

export const GAME_IDS = [
  "stop_matematico",
  "caca_soma",
  "cubo_magico",
  "caca_coroa",
  "super_jogo_da_velha",
  "guerra_matematica",
  "bomb_game",
  "puzzle_wire",
  "houses",
] as const;

export type GameId = (typeof GAME_IDS)[number];
export type EntryPoint =
  | "game_catalog"
  | "teacher_manual"
  | "direct_route"
  | "classroom";
export type GameMode =
  | "solo"
  | "local_multiplayer"
  | "ai"
  | "online_private"
  | "classroom";
export type UsageContext = "standard" | "classroom";
export type FeedbackEntryPoint = "contact_page" | "teacher_manual";
export type ClassroomCreateErrorCode = "server_error";
export type MultiplayerJoinType = "classroom_room" | "private_code";
export type MultiplayerJoinErrorCode =
  | "classroom_not_found"
  | "invalid_name"
  | "network_error"
  | "room_full"
  | "room_not_found"
  | "room_not_joinable"
  | "server_error"
  | "server_unavailable";
export type MultiplayerDisconnectErrorCode =
  | "network_error"
  | "server_disconnect"
  | "timeout"
  | "transport_error";
export type MultiplayerConnectionStage = "playing" | "waiting";
export type ActivityEndReason =
  | "completed"
  | "abandoned"
  | "error"
  | "disconnected";
export type ActivityOutcome =
  | "completed"
  | "draw"
  | "failed"
  | "loss"
  | "passed"
  | "win";
export type ActivityVariant =
  | "lesson"
  | "level"
  | "random"
  | "review"
  | "tutorial";

interface PageViewedParameters {
  pageTitle: string;
  pageLocation: string;
}

interface GameSelectedParameters {
  gameId: GameId;
  entryPoint: EntryPoint;
}

export interface GameStartedParameters {
  gameId: GameId;
  gameMode: GameMode;
  usageContext: UsageContext;
  participantCount?: number;
  entryPoint?: EntryPoint;
  levelId?: string;
  difficulty?: string;
  activityVariant?: ActivityVariant;
}

export interface GameEndedParameters extends GameStartedParameters {
  durationSeconds: number;
  endReason: ActivityEndReason;
  success?: boolean;
  outcome?: ActivityOutcome;
  completedStepCount?: number;
  correctCount?: number;
  incorrectCount?: number;
  hintCount?: number;
  assistanceCount?: number;
  starsEarned?: number;
}

export interface LevelStartedParameters {
  gameId: GameId;
  levelId: string;
  gameMode: GameMode;
  usageContext: UsageContext;
  participantCount?: number;
}

export interface LevelEndedParameters extends LevelStartedParameters {
  durationSeconds: number;
  endReason: ActivityEndReason;
  completedRoundCount: number;
  correctCount: number;
  incorrectCount: number;
  success?: boolean;
  outcome?: ActivityOutcome;
  starsEarned?: number;
}

interface TutorialParameters {
  gameId: GameId;
  tutorialId: string;
}

interface TutorialSkippedParameters extends TutorialParameters {
  stepId?: string;
}

interface ClassroomCreateResultParameters {
  success: boolean;
  errorCode?: ClassroomCreateErrorCode;
}

interface FeedbackOpenedParameters {
  entryPoint: FeedbackEntryPoint;
}

interface LocalProgressResetParameters {
  reason: "player_switch";
}

export interface MultiplayerJoinResultParameters {
  gameId: GameId;
  joinType: MultiplayerJoinType;
  success: boolean;
  waitMs: number;
  errorCode?: MultiplayerJoinErrorCode;
}

export interface MultiplayerDisconnectParameters {
  gameId: GameId;
  joinType: MultiplayerJoinType;
  connectionStage: MultiplayerConnectionStage;
  errorCode: MultiplayerDisconnectErrorCode;
}

const SAFE_CAMPAIGN_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function getSafePageLocation(rawLocation: string): string {
  const source = new URL(rawLocation);
  const safeLocation = new URL(source.pathname, source.origin);

  for (const parameter of SAFE_CAMPAIGN_PARAMETERS) {
    for (const value of source.searchParams.getAll(parameter)) {
      safeLocation.searchParams.append(parameter, value);
    }
  }

  return safeLocation.toString();
}

export function formatLevelId(levelNumber: number): string {
  return `level_${String(levelNumber).padStart(2, "0")}`;
}

export function formatAiDifficulty(difficulty: number): string {
  return ["very_easy", "easy", "medium", "hard"][difficulty - 1] ??
    "unknown";
}

export const analytics = {
  pageViewed({ pageTitle, pageLocation }: PageViewedParameters): boolean {
    return sendAnalyticsEvent("page_view", {
      page_title: pageTitle,
      page_location: getSafePageLocation(pageLocation),
    });
  },

  gameSelected({ gameId, entryPoint }: GameSelectedParameters): boolean {
    return sendAnalyticsEvent("select_content", {
      content_type: "game",
      content_id: gameId,
      entry_point: entryPoint,
    });
  },

  classroomCreateResult({
    success,
    errorCode,
  }: ClassroomCreateResultParameters): boolean {
    return sendAnalyticsEvent("classroom_create_result", {
      success,
      error_code: success ? undefined : errorCode,
    });
  },

  feedbackOpened({ entryPoint }: FeedbackOpenedParameters): boolean {
    return sendAnalyticsEvent("feedback_open", {
      entry_point: entryPoint,
    });
  },

  localProgressReset({ reason }: LocalProgressResetParameters): boolean {
    return sendAnalyticsEvent("local_progress_reset", { reason });
  },

  multiplayerJoinResult({
    gameId,
    joinType,
    success,
    waitMs,
    errorCode,
  }: MultiplayerJoinResultParameters): boolean {
    const isClassroomJoin = joinType === "classroom_room";

    return sendAnalyticsEvent("multiplayer_join_result", {
      game_id: gameId,
      game_mode: isClassroomJoin ? "classroom" : "online_private",
      usage_context: isClassroomJoin ? "classroom" : "standard",
      join_type: joinType,
      success,
      wait_ms: waitMs,
      error_code: success ? undefined : errorCode,
    });
  },

  multiplayerDisconnected({
    gameId,
    joinType,
    connectionStage,
    errorCode,
  }: MultiplayerDisconnectParameters): boolean {
    const isClassroomRoom = joinType === "classroom_room";

    return sendAnalyticsEvent("multiplayer_disconnect", {
      game_id: gameId,
      game_mode: isClassroomRoom ? "classroom" : "online_private",
      usage_context: isClassroomRoom ? "classroom" : "standard",
      connection_stage: connectionStage,
      error_code: errorCode,
    });
  },

  gameStarted({
    gameId,
    gameMode,
    usageContext,
    participantCount,
    entryPoint,
    levelId,
    difficulty,
    activityVariant,
  }: GameStartedParameters): boolean {
    return sendAnalyticsEvent("game_start", {
      game_id: gameId,
      game_mode: gameMode,
      usage_context: usageContext,
      participant_count: participantCount,
      entry_point: entryPoint,
      level_id: levelId,
      difficulty,
      activity_variant: activityVariant,
    });
  },

  gameEnded({
    gameId,
    gameMode,
    usageContext,
    participantCount,
    entryPoint,
    levelId,
    difficulty,
    activityVariant,
    durationSeconds,
    endReason,
    success,
    outcome,
    completedStepCount,
    correctCount,
    incorrectCount,
    hintCount,
    assistanceCount,
    starsEarned,
  }: GameEndedParameters): boolean {
    return sendAnalyticsEvent("game_end", {
      game_id: gameId,
      game_mode: gameMode,
      usage_context: usageContext,
      participant_count: participantCount,
      entry_point: entryPoint,
      level_id: levelId,
      difficulty,
      activity_variant: activityVariant,
      duration_seconds: durationSeconds,
      end_reason: endReason,
      success,
      outcome,
      completed_step_count: completedStepCount,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      hint_count: hintCount,
      assistance_count: assistanceCount,
      stars_earned: starsEarned,
    });
  },

  levelStarted({
    gameId,
    levelId,
    gameMode,
    usageContext,
    participantCount,
  }: LevelStartedParameters): boolean {
    return sendAnalyticsEvent("level_start", {
      game_id: gameId,
      level_id: levelId,
      game_mode: gameMode,
      usage_context: usageContext,
      participant_count: participantCount,
    });
  },

  levelEnded({
    gameId,
    levelId,
    gameMode,
    usageContext,
    participantCount,
    durationSeconds,
    endReason,
    completedRoundCount,
    correctCount,
    incorrectCount,
    success,
    outcome,
    starsEarned,
  }: LevelEndedParameters): boolean {
    return sendAnalyticsEvent("level_end", {
      game_id: gameId,
      level_id: levelId,
      game_mode: gameMode,
      usage_context: usageContext,
      participant_count: participantCount,
      duration_seconds: durationSeconds,
      end_reason: endReason,
      completed_round_count: completedRoundCount,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      success,
      outcome,
      stars_earned: starsEarned,
    });
  },

  tutorialBegan({ gameId, tutorialId }: TutorialParameters): boolean {
    return sendAnalyticsEvent("tutorial_begin", {
      game_id: gameId,
      tutorial_id: tutorialId,
    });
  },

  tutorialCompleted({ gameId, tutorialId }: TutorialParameters): boolean {
    return sendAnalyticsEvent("tutorial_complete", {
      game_id: gameId,
      tutorial_id: tutorialId,
    });
  },

  tutorialSkipped({
    gameId,
    tutorialId,
    stepId,
  }: TutorialSkippedParameters): boolean {
    return sendAnalyticsEvent("tutorial_skip", {
      game_id: gameId,
      tutorial_id: tutorialId,
      step_id: stepId,
    });
  },
};
