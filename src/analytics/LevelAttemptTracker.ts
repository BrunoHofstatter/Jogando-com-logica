import { ActivityTimer } from "./ActivityTimer";
import {
  ActivityOutcome,
  analytics,
  LevelEndedParameters,
  LevelStartedParameters,
} from "./events";

interface LevelAttemptEvents {
  levelStarted: (parameters: LevelStartedParameters) => boolean;
  levelEnded: (parameters: LevelEndedParameters) => boolean;
}

interface AttemptCompletion {
  success: boolean;
  outcome: ActivityOutcome;
  starsEarned: number;
}

interface AttemptProgress {
  correctCount: number;
  incorrectCount: number;
}

export class LevelAttemptTracker {
  private timer: ActivityTimer | null = null;
  private progress: AttemptProgress = {
    correctCount: 0,
    incorrectCount: 0,
  };

  constructor(
    private readonly context: LevelStartedParameters,
    private readonly events: LevelAttemptEvents = analytics,
  ) {}

  start(nowMs: number, isVisible = true): boolean {
    if (this.timer !== null) {
      return false;
    }

    this.progress = { correctCount: 0, incorrectCount: 0 };
    this.timer = new ActivityTimer(nowMs);

    if (!isVisible) {
      this.timer.pause(nowMs);
    }

    this.events.levelStarted(this.context);
    return true;
  }

  recordRound(correct: boolean): boolean {
    if (this.timer === null) {
      return false;
    }

    if (correct) {
      this.progress.correctCount += 1;
    } else {
      this.progress.incorrectCount += 1;
    }

    return true;
  }

  pause(nowMs: number): void {
    this.timer?.pause(nowMs);
  }

  resume(nowMs: number): void {
    this.timer?.resume(nowMs);
  }

  complete(completion: AttemptCompletion, nowMs: number): boolean {
    return this.finalize(
      {
        endReason: "completed",
        ...completion,
      },
      nowMs,
    );
  }

  abandon(nowMs: number): boolean {
    return this.finalize({ endReason: "abandoned" }, nowMs);
  }

  private finalize(
    result:
      | ({ endReason: "completed" } & AttemptCompletion)
      | { endReason: "abandoned" },
    nowMs: number,
  ): boolean {
    if (this.timer === null) {
      return false;
    }

    const durationSeconds = this.timer.finish(nowMs);
    if (durationSeconds === null) {
      return false;
    }

    const completedRoundCount =
      this.progress.correctCount + this.progress.incorrectCount;

    this.events.levelEnded({
      ...this.context,
      durationSeconds,
      endReason: result.endReason,
      completedRoundCount,
      correctCount: this.progress.correctCount,
      incorrectCount: this.progress.incorrectCount,
      success: "success" in result ? result.success : undefined,
      outcome: "outcome" in result ? result.outcome : undefined,
      starsEarned: "starsEarned" in result ? result.starsEarned : undefined,
    });
    this.timer = null;
    return true;
  }
}
