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
