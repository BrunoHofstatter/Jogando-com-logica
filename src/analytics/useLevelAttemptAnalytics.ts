import { useCallback, useEffect, useRef } from "react";
import { LevelStartedParameters } from "./events";
import { LevelAttemptTracker } from "./LevelAttemptTracker";

interface AttemptCompletion {
  success: boolean;
  outcome: "passed" | "failed";
  starsEarned: number;
}

interface LevelAttemptLifecycleTargets {
  documentTarget: Pick<EventTarget, "addEventListener" | "removeEventListener"> & {
    visibilityState: string;
  };
  windowTarget: Pick<EventTarget, "addEventListener" | "removeEventListener">;
}

export function bindLevelAttemptLifecycle(
  tracker: LevelAttemptTracker,
  { documentTarget, windowTarget }: LevelAttemptLifecycleTargets,
  now: () => number = Date.now,
): () => void {
  const handleVisibilityChange = () => {
    if (documentTarget.visibilityState === "visible") {
      tracker.resume(now());
    } else {
      tracker.pause(now());
    }
  };

  const handlePageHide = () => {
    tracker.abandon(now());
  };

  documentTarget.addEventListener("visibilitychange", handleVisibilityChange);
  windowTarget.addEventListener("pagehide", handlePageHide);

  return () => {
    documentTarget.removeEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );
    windowTarget.removeEventListener("pagehide", handlePageHide);
    tracker.abandon(now());
  };
}

export function useLevelAttemptAnalytics(
  context: LevelStartedParameters | null,
) {
  const trackerRef = useRef<LevelAttemptTracker | null>(null);
  const gameId = context?.gameId;
  const gameMode = context?.gameMode;
  const levelId = context?.levelId;
  const participantCount = context?.participantCount;
  const usageContext = context?.usageContext;

  useEffect(() => {
    if (!gameId || !gameMode || !levelId || !usageContext) {
      trackerRef.current = null;
      return;
    }

    const tracker = new LevelAttemptTracker({
      gameId,
      gameMode,
      levelId,
      participantCount,
      usageContext,
    });
    trackerRef.current = tracker;
    const unbindLifecycle = bindLevelAttemptLifecycle(tracker, {
      documentTarget: document,
      windowTarget: window,
    });

    return () => {
      unbindLifecycle();

      if (trackerRef.current === tracker) {
        trackerRef.current = null;
      }
    };
  }, [
    gameId,
    gameMode,
    levelId,
    participantCount,
    usageContext,
  ]);

  const startAttempt = useCallback(() => {
    return trackerRef.current?.start(
      Date.now(),
      document.visibilityState === "visible",
    ) ?? false;
  }, []);

  const recordRound = useCallback((correct: boolean) => {
    return trackerRef.current?.recordRound(correct) ?? false;
  }, []);

  const completeAttempt = useCallback((completion: AttemptCompletion) => {
    return trackerRef.current?.complete(completion, Date.now()) ?? false;
  }, []);

  return { completeAttempt, recordRound, startAttempt };
}
