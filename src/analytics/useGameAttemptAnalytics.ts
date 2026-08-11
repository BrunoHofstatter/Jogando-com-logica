import { useCallback, useEffect, useRef } from "react";
import {
  GameAttemptCompletion,
  GameAttemptTracker,
} from "./GameAttemptTracker";
import { GameStartedParameters } from "./events";

interface GameAttemptLifecycleTargets {
  documentTarget: Pick<EventTarget, "addEventListener" | "removeEventListener"> & {
    visibilityState: string;
  };
  windowTarget: Pick<EventTarget, "addEventListener" | "removeEventListener">;
}

export function bindGameAttemptLifecycle(
  tracker: GameAttemptTracker,
  { documentTarget, windowTarget }: GameAttemptLifecycleTargets,
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

export function useGameAttemptAnalytics(
  context: GameStartedParameters | null,
) {
  const trackerRef = useRef<GameAttemptTracker | null>(null);
  const activityVariant = context?.activityVariant;
  const difficulty = context?.difficulty;
  const entryPoint = context?.entryPoint;
  const gameId = context?.gameId;
  const gameMode = context?.gameMode;
  const levelId = context?.levelId;
  const participantCount = context?.participantCount;
  const usageContext = context?.usageContext;

  useEffect(() => {
    if (!gameId || !gameMode || !usageContext) {
      trackerRef.current = null;
      return;
    }

    const tracker = new GameAttemptTracker({
      activityVariant,
      difficulty,
      entryPoint,
      gameId,
      gameMode,
      levelId,
      participantCount,
      usageContext,
    });
    trackerRef.current = tracker;
    const unbindLifecycle = bindGameAttemptLifecycle(tracker, {
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
    activityVariant,
    difficulty,
    entryPoint,
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

  const completeAttempt = useCallback((completion: GameAttemptCompletion) => {
    return trackerRef.current?.complete(completion, Date.now()) ?? false;
  }, []);

  return { completeAttempt, startAttempt };
}
