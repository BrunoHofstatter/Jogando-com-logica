import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendAnalyticsEvent } from "./analytics";
import { analytics } from "./events";

vi.mock("./analytics", () => ({
  sendAnalyticsEvent: vi.fn(() => true),
}));

const mockedSendAnalyticsEvent = vi.mocked(sendAnalyticsEvent);

describe("typed analytics events", () => {
  beforeEach(() => {
    mockedSendAnalyticsEvent.mockClear();
  });

  it("maps a level start to the documented GA4 payload", () => {
    analytics.levelStarted({
      gameId: "caca_soma",
      levelId: "level_01",
      gameMode: "solo",
      usageContext: "standard",
      participantCount: 1,
    });

    expect(mockedSendAnalyticsEvent).toHaveBeenCalledWith("level_start", {
      game_id: "caca_soma",
      level_id: "level_01",
      game_mode: "solo",
      usage_context: "standard",
      participant_count: 1,
    });
  });

  it("maps a completed level end without answer-level data", () => {
    analytics.levelEnded({
      gameId: "caca_soma",
      levelId: "level_01",
      gameMode: "solo",
      usageContext: "standard",
      participantCount: 1,
      durationSeconds: 42,
      endReason: "completed",
      completedRoundCount: 5,
      correctCount: 4,
      incorrectCount: 1,
      success: true,
      outcome: "passed",
      starsEarned: 2,
    });

    expect(mockedSendAnalyticsEvent).toHaveBeenCalledWith("level_end", {
      game_id: "caca_soma",
      level_id: "level_01",
      game_mode: "solo",
      usage_context: "standard",
      participant_count: 1,
      duration_seconds: 42,
      end_reason: "completed",
      completed_round_count: 5,
      correct_count: 4,
      incorrect_count: 1,
      success: true,
      outcome: "passed",
      stars_earned: 2,
    });
  });

  it("maps a game lifecycle with controlled activity context", () => {
    analytics.gameStarted({
      gameId: "stop_matematico",
      gameMode: "solo",
      usageContext: "standard",
      participantCount: 1,
      levelId: "level_03",
      activityVariant: "level",
    });

    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith("game_start", {
      game_id: "stop_matematico",
      game_mode: "solo",
      usage_context: "standard",
      participant_count: 1,
      entry_point: undefined,
      level_id: "level_03",
      difficulty: undefined,
      activity_variant: "level",
    });

    analytics.gameEnded({
      gameId: "stop_matematico",
      gameMode: "solo",
      usageContext: "standard",
      participantCount: 1,
      levelId: "level_03",
      activityVariant: "level",
      durationSeconds: 31,
      endReason: "completed",
      success: true,
      outcome: "passed",
      correctCount: 7,
      incorrectCount: 1,
      starsEarned: 2,
    });

    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith("game_end", {
      game_id: "stop_matematico",
      game_mode: "solo",
      usage_context: "standard",
      participant_count: 1,
      entry_point: undefined,
      level_id: "level_03",
      difficulty: undefined,
      activity_variant: "level",
      duration_seconds: 31,
      end_reason: "completed",
      success: true,
      outcome: "passed",
      completed_step_count: undefined,
      correct_count: 7,
      incorrect_count: 1,
      hint_count: undefined,
      assistance_count: undefined,
      stars_earned: 2,
    });
  });

  it("maps teacher and shared-device actions without identifying values", () => {
    analytics.gameSelected({
      gameId: "caca_coroa",
      entryPoint: "teacher_manual",
    });
    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith("select_content", {
      content_type: "game",
      content_id: "caca_coroa",
      entry_point: "teacher_manual",
    });

    analytics.feedbackOpened({ entryPoint: "contact_page" });
    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith("feedback_open", {
      entry_point: "contact_page",
    });

    analytics.localProgressReset({ reason: "player_switch" });
    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith(
      "local_progress_reset",
      { reason: "player_switch" },
    );
  });

  it("maps only the confirmed classroom creation result", () => {
    analytics.classroomCreateResult({ success: true });
    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith(
      "classroom_create_result",
      { success: true, error_code: undefined },
    );

    analytics.classroomCreateResult({
      success: false,
      errorCode: "server_error",
    });
    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith(
      "classroom_create_result",
      { success: false, error_code: "server_error" },
    );
  });

  it("maps multiplayer join results as participant attempts", () => {
    analytics.multiplayerJoinResult({
      gameId: "guerra_matematica",
      joinType: "private_code",
      success: true,
      waitMs: 320,
    });
    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith(
      "multiplayer_join_result",
      {
        game_id: "guerra_matematica",
        game_mode: "online_private",
        usage_context: "standard",
        join_type: "private_code",
        success: true,
        wait_ms: 320,
        error_code: undefined,
      },
    );

    analytics.multiplayerJoinResult({
      gameId: "bomb_game",
      joinType: "classroom_room",
      success: false,
      waitMs: 825,
      errorCode: "room_full",
    });
    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith(
      "multiplayer_join_result",
      {
        game_id: "bomb_game",
        game_mode: "classroom",
        usage_context: "classroom",
        join_type: "classroom_room",
        success: false,
        wait_ms: 825,
        error_code: "room_full",
      },
    );
  });

  it("maps unexpected multiplayer disconnects without room identity", () => {
    analytics.multiplayerDisconnected({
      gameId: "caca_soma",
      joinType: "classroom_room",
      connectionStage: "playing",
      errorCode: "timeout",
    });

    expect(mockedSendAnalyticsEvent).toHaveBeenLastCalledWith(
      "multiplayer_disconnect",
      {
        game_id: "caca_soma",
        game_mode: "classroom",
        usage_context: "classroom",
        connection_stage: "playing",
        error_code: "timeout",
      },
    );
  });

  it("maps tutorial skip with only the controlled current step ID", () => {
    analytics.tutorialSkipped({
      gameId: "caca_soma",
      tutorialId: "caca_soma_levels_v1",
      stepId: "step3",
    });

    expect(mockedSendAnalyticsEvent).toHaveBeenCalledWith("tutorial_skip", {
      game_id: "caca_soma",
      tutorial_id: "caca_soma_levels_v1",
      step_id: "step3",
    });
  });
});
