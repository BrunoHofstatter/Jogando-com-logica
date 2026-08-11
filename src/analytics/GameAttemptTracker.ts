import { ActivityTimer } from "./ActivityTimer";
import {
  ActivityEndReason,
  ActivityOutcome,
  analytics,
  GameEndedParameters,
  GameStartedParameters,
} from "./events";

interface GameAttemptEvents {
  gameStarted: (parameters: GameStartedParameters) => boolean;
  gameEnded: (parameters: GameEndedParameters) => boolean;
}

export interface GameAttemptCompletion {
  success?: boolean;
  outcome?: ActivityOutcome;
  completedStepCount?: number;
  correctCount?: number;
  incorrectCount?: number;
  hintCount?: number;
  assistanceCount?: number;
  starsEarned?: number;
}

export class GameAttemptTracker {
  private timer: ActivityTimer | null = null;

  constructor(
    private readonly context: GameStartedParameters,
    private readonly events: GameAttemptEvents = analytics,
  ) {}

  start(nowMs: number, isVisible = true): boolean {
    if (this.timer !== null) {
      return false;
    }

    this.timer = new ActivityTimer(nowMs);
    if (!isVisible) {
      this.timer.pause(nowMs);
    }

    this.events.gameStarted(this.context);
    return true;
  }

  pause(nowMs: number): void {
    this.timer?.pause(nowMs);
  }

  resume(nowMs: number): void {
    this.timer?.resume(nowMs);
  }

  complete(completion: GameAttemptCompletion, nowMs: number): boolean {
    return this.finalize("completed", completion, nowMs);
  }

  abandon(nowMs: number): boolean {
    return this.finalize("abandoned", {}, nowMs);
  }

  disconnect(nowMs: number): boolean {
    return this.finalize("disconnected", {}, nowMs);
  }

  failWithError(nowMs: number): boolean {
    return this.finalize("error", {}, nowMs);
  }

  private finalize(
    endReason: ActivityEndReason,
    completion: GameAttemptCompletion,
    nowMs: number,
  ): boolean {
    if (this.timer === null) {
      return false;
    }

    const durationSeconds = this.timer.finish(nowMs);
    if (durationSeconds === null) {
      return false;
    }

    this.events.gameEnded({
      ...this.context,
      durationSeconds,
      endReason,
      ...completion,
    });
    this.timer = null;
    return true;
  }
}
