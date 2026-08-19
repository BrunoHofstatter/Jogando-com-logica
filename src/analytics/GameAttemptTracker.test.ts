import { describe, expect, it, vi } from "vitest";
import { GameAttemptTracker } from "./GameAttemptTracker";
import { bindGameAttemptLifecycle } from "./useGameAttemptAnalytics";

function createEvents() {
  return {
    gameStarted: vi.fn(() => true),
    gameEnded: vi.fn(() => true),
  };
}

function createTracker(events = createEvents()) {
  return {
    events,
    tracker: new GameAttemptTracker(
      {
        gameId: "caca_coroa",
        gameMode: "ai",
        usageContext: "standard",
        playerSlotCount: 1,
        difficulty: "easy",
      },
      events,
    ),
  };
}

describe("GameAttemptTracker", () => {
  it("sends one start and one completed end with foreground duration", () => {
    const { events, tracker } = createTracker();

    expect(tracker.start(1_000)).toBe(true);
    expect(tracker.start(2_000)).toBe(false);
    tracker.pause(6_000);
    tracker.resume(11_000);
    expect(
      tracker.complete({ outcome: "win", success: true }, 14_500),
    ).toBe(true);
    expect(tracker.abandon(20_000)).toBe(false);

    expect(events.gameStarted).toHaveBeenCalledTimes(1);
    expect(events.gameEnded).toHaveBeenCalledTimes(1);
    expect(events.gameEnded).toHaveBeenCalledWith({
      gameId: "caca_coroa",
      gameMode: "ai",
      usageContext: "standard",
      playerSlotCount: 1,
      difficulty: "easy",
      durationSeconds: 8,
      endReason: "completed",
      outcome: "win",
      success: true,
    });
  });

  it("can start a fresh attempt after a completed attempt", () => {
    const { events, tracker } = createTracker();

    tracker.start(0);
    tracker.complete({ outcome: "loss", success: false }, 2_000);
    expect(tracker.start(3_000)).toBe(true);
    tracker.abandon(5_500);

    expect(events.gameStarted).toHaveBeenCalledTimes(2);
    expect(events.gameEnded).toHaveBeenCalledTimes(2);
    expect(events.gameEnded).toHaveBeenLastCalledWith(
      expect.objectContaining({
        durationSeconds: 2,
        endReason: "abandoned",
      }),
    );
  });

  it("abandons once on pagehide or cleanup and excludes hidden time", () => {
    const { events, tracker } = createTracker();
    let now = 0;
    const documentTarget = new EventTarget() as EventTarget & {
      visibilityState: string;
    };
    documentTarget.visibilityState = "visible";
    const windowTarget = new EventTarget();
    const unbind = bindGameAttemptLifecycle(
      tracker,
      { documentTarget, windowTarget },
      () => now,
    );

    tracker.start(now);
    now = 1_000;
    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    now = 6_000;
    documentTarget.visibilityState = "visible";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    now = 8_000;
    windowTarget.dispatchEvent(new Event("pagehide"));
    unbind();

    expect(events.gameEnded).toHaveBeenCalledTimes(1);
    expect(events.gameEnded).toHaveBeenCalledWith(
      expect.objectContaining({
        durationSeconds: 3,
        endReason: "abandoned",
      }),
    );
  });
});
