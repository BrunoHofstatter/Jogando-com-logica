import { sendAnalyticsEvent } from "./analytics";

export const GAME_IDS = [
  "stop_matematico",
  "caca_soma",
  "cubo_magico",
  "caca_coroa",
  "super_jogo_da_velha",
  "guerra_matematica",
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
export type ActivityEndReason =
  | "completed"
  | "abandoned"
  | "error"
  | "disconnected";
export type ActivityOutcome = "passed" | "failed";

interface PageViewedParameters {
  pageTitle: string;
  pageLocation: string;
}

interface GameSelectedParameters {
  gameId: GameId;
  entryPoint: EntryPoint;
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
