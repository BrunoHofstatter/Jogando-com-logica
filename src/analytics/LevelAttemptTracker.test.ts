import { describe, expect, it, vi } from "vitest";
import { LevelAttemptTracker } from "./LevelAttemptTracker";
import { bindLevelAttemptLifecycle } from "./useLevelAttemptAnalytics";

const ATTEMPT_CONTEXT = {
  gameId: "caca_soma" as const,
  levelId: "level_01",
  gameMode: "solo" as const,
  usageContext: "standard" as const,
  participantCount: 1,
};

function createEvents() {
  return {
    levelStarted: vi.fn(() => true),
    levelEnded: vi.fn(() => true),
  };
}

describe("LevelAttemptTracker", () => {
  it("starts once and completes once with aggregate results", () => {
    const events = createEvents();
    const tracker = new LevelAttemptTracker(ATTEMPT_CONTEXT, events);

    expect(tracker.start(1_000)).toBe(true);
    expect(tracker.start(2_000)).toBe(false);
    expect(tracker.recordRound(true)).toBe(true);
    expect(tracker.recordRound(false)).toBe(true);
    expect(
      tracker.complete(
        { success: false, outcome: "failed", starsEarned: 1 },
        11_900,
      ),
    ).toBe(true);
    expect(tracker.abandon(12_000)).toBe(false);

    expect(events.levelStarted).toHaveBeenCalledOnce();
    expect(events.levelStarted).toHaveBeenCalledWith(ATTEMPT_CONTEXT);
    expect(events.levelEnded).toHaveBeenCalledOnce();
    expect(events.levelEnded).toHaveBeenCalledWith({
      ...ATTEMPT_CONTEXT,
      durationSeconds: 10,
      endReason: "completed",
      completedRoundCount: 2,
      correctCount: 1,
      incorrectCount: 1,
      success: false,
      outcome: "failed",
      starsEarned: 1,
    });
  });

  it("pauses hidden time without ending the attempt", () => {
    const events = createEvents();
    const tracker = new LevelAttemptTracker(ATTEMPT_CONTEXT, events);

    tracker.start(1_000);
    tracker.pause(6_000);
    tracker.resume(11_000);
    tracker.recordRound(true);
    tracker.complete(
      { success: true, outcome: "passed", starsEarned: 3 },
      14_500,
    );

    expect(events.levelEnded).toHaveBeenCalledWith(
      expect.objectContaining({
        durationSeconds: 8,
        endReason: "completed",
      }),
    );
  });

  it("sends one abandonment with only submitted-round aggregates", () => {
    const events = createEvents();
    const tracker = new LevelAttemptTracker(ATTEMPT_CONTEXT, events);

    tracker.start(1_000);
    tracker.recordRound(false);

    expect(tracker.abandon(4_800)).toBe(true);
    expect(tracker.abandon(5_000)).toBe(false);
    expect(events.levelEnded).toHaveBeenCalledWith({
      ...ATTEMPT_CONTEXT,
      durationSeconds: 3,
      endReason: "abandoned",
      completedRoundCount: 1,
      correctCount: 0,
      incorrectCount: 1,
      success: undefined,
      outcome: undefined,
      starsEarned: undefined,
    });
  });

  it("allows a retry to create a new independent attempt", () => {
    const events = createEvents();
    const tracker = new LevelAttemptTracker(ATTEMPT_CONTEXT, events);

    tracker.start(1_000);
    tracker.recordRound(false);
    tracker.complete(
      { success: false, outcome: "failed", starsEarned: 0 },
      2_000,
    );

    expect(tracker.start(3_000)).toBe(true);
    tracker.recordRound(true);
    tracker.abandon(5_000);

    expect(events.levelStarted).toHaveBeenCalledTimes(2);
    expect(events.levelEnded).toHaveBeenCalledTimes(2);
    expect(events.levelEnded).toHaveBeenLastCalledWith(
      expect.objectContaining({
        completedRoundCount: 1,
        correctCount: 1,
        incorrectCount: 0,
      }),
    );
  });

  it("starts paused when gameplay becomes ready in a hidden document", () => {
    const events = createEvents();
    const tracker = new LevelAttemptTracker(ATTEMPT_CONTEXT, events);

    tracker.start(1_000, false);
    tracker.resume(6_000);
    tracker.abandon(8_500);

    expect(events.levelEnded).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 2 }),
    );
  });

  it("binds tab visibility and refresh pagehide to the guarded lifecycle", () => {
    const events = createEvents();
    const tracker = new LevelAttemptTracker(ATTEMPT_CONTEXT, events);
    const documentTarget = Object.assign(new EventTarget(), {
      visibilityState: "visible",
    });
    const windowTarget = new EventTarget();
    let nowMs = 1_000;
    const unbind = bindLevelAttemptLifecycle(
      tracker,
      { documentTarget, windowTarget },
      () => nowMs,
    );

    tracker.start(nowMs);
    nowMs = 6_000;
    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    nowMs = 11_000;
    documentTarget.visibilityState = "visible";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    nowMs = 14_500;
    windowTarget.dispatchEvent(new Event("pagehide"));
    unbind();

    expect(events.levelEnded).toHaveBeenCalledOnce();
    expect(events.levelEnded).toHaveBeenCalledWith(
      expect.objectContaining({
        durationSeconds: 8,
        endReason: "abandoned",
      }),
    );
  });

  it("uses lifecycle cleanup as one route-exit abandonment fallback", () => {
    const events = createEvents();
    const tracker = new LevelAttemptTracker(ATTEMPT_CONTEXT, events);
    const documentTarget = Object.assign(new EventTarget(), {
      visibilityState: "visible",
    });
    const windowTarget = new EventTarget();
    let nowMs = 1_000;
    const unbind = bindLevelAttemptLifecycle(
      tracker,
      { documentTarget, windowTarget },
      () => nowMs,
    );

    tracker.start(nowMs);
    nowMs = 4_000;
    unbind();

    expect(events.levelEnded).toHaveBeenCalledOnce();
    expect(events.levelEnded).toHaveBeenCalledWith(
      expect.objectContaining({
        durationSeconds: 3,
        endReason: "abandoned",
      }),
    );
  });
});
