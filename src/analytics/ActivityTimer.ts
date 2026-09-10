export class ActivityTimer {
  private activeSinceMs: number | null;
  private activeDurationMs = 0;
  private finished = false;

  constructor(startedAtMs: number) {
    this.activeSinceMs = startedAtMs;
  }

  pause(nowMs: number): void {
    if (this.finished || this.activeSinceMs === null) {
      return;
    }

    this.activeDurationMs += Math.max(0, nowMs - this.activeSinceMs);
    this.activeSinceMs = null;
  }

  resume(nowMs: number): void {
    if (this.finished || this.activeSinceMs !== null) {
      return;
    }

    this.activeSinceMs = nowMs;
  }

  finish(nowMs: number): number | null {
    if (this.finished) {
      return null;
    }

    this.pause(nowMs);
    this.finished = true;
    return Math.floor(this.activeDurationMs / 1000);
  }
}
