import { useEffect } from "react";
import { GameStartedParameters } from "./events";
import { useGameAttemptAnalytics } from "./useGameAttemptAnalytics";

interface BoardGameAnalyticsOptions {
  context: GameStartedParameters;
  isReady: boolean;
  status: "playing" | "ended";
  winner: string | number | null;
  perspective?: string | number;
  isDraw?: boolean;
}

export function useBoardGameAnalytics({
  context,
  isReady,
  status,
  winner,
  perspective,
  isDraw = false,
}: BoardGameAnalyticsOptions): void {
  const { completeAttempt, startAttempt } = useGameAttemptAnalytics(context);

  useEffect(() => {
    if (isReady && status === "playing") {
      startAttempt();
    }
  }, [isReady, startAttempt, status]);

  useEffect(() => {
    if (status !== "ended") {
      return;
    }

    if (isDraw || winner === null) {
      completeAttempt({ outcome: "draw" });
      return;
    }

    if (perspective === undefined) {
      completeAttempt({ outcome: "completed" });
      return;
    }

    const won = winner === perspective;
    completeAttempt({
      outcome: won ? "win" : "loss",
      success: won,
    });
  }, [completeAttempt, isDraw, perspective, status, winner]);
}
