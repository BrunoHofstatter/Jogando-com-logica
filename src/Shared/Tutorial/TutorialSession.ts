import { recordTutorialHistory, type TutorialIdentity } from "./tutorialHistory";

export type TutorialPhase = "active" | "resolving" | "transitioning";
export type TutorialOutcome = "completed" | "dismissed" | "cancelled";

interface PendingWait {
  timer?: ReturnType<typeof setTimeout>;
  remaining: number;
  started: number;
  token: object;
  callback: () => void;
}

/** A token belongs to this instance and exactly one stage activation. */
export class TutorialSession {
  private token: object = {};
  private running = false;
  private pending = new Set<PendingWait>();
  private paused = false;
  stage = "";
  phase: TutorialPhase = "active";

  constructor(private readonly identity?: TutorialIdentity) {}

  start(stage: string): object {
    this.cancel();
    this.running = true;
    this.stage = stage;
    this.phase = "active";
    return this.token;
  }

  current(token: object): boolean { return this.running && token === this.token; }

  enter(token: object, stage: string, phase: TutorialPhase = "active"): object | null {
    if (!this.current(token)) return null;
    this.invalidate();
    this.stage = stage;
    this.phase = phase;
    return this.token;
  }

  wait(token: object, milliseconds: number, callback: () => void): void {
    if (!this.current(token)) return;
    const wait: PendingWait = { remaining: Math.max(0, milliseconds), started: 0, token, callback };
    this.pending.add(wait);
    this.schedule(wait);
  }

  /** Preserve remaining reading time when the lesson is in a hidden tab. */
  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    this.pending.forEach(wait => {
      if (paused && wait.timer !== undefined) {
        clearTimeout(wait.timer);
        wait.remaining = Math.max(0, wait.remaining - (Date.now() - wait.started));
        wait.timer = undefined;
      } else if (!paused) this.schedule(wait);
    });
  }

  private schedule(wait: PendingWait) {
    if (this.paused || !this.current(wait.token)) return;
    wait.started = Date.now();
    wait.timer = setTimeout(() => {
      this.pending.delete(wait);
      if (this.current(wait.token)) wait.callback();
    }, wait.remaining);
  }

  finish(token: object, outcome: TutorialOutcome): boolean {
    if (!this.current(token)) return false;
    this.cancel();
    if (this.identity && outcome !== "cancelled") recordTutorialHistory(this.identity, outcome);
    return true;
  }

  cancel(): void {
    this.running = false;
    this.invalidate();
  }

  private invalidate() {
    this.pending.forEach(wait => { if (wait.timer !== undefined) clearTimeout(wait.timer); });
    this.pending.clear();
    this.token = {};
  }
}
