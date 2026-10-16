import { TutorialSession } from "../../Shared/Tutorial/TutorialSession";
import { applyAction, createInitialState, getLegalActionsForPiece, resolveMoveIntent } from "../Logic/v2";
import type { MathWarState, MoveIntent, Position } from "../Logic/v2";
import { at, captainFixture, captureFixture, diagonalFixture, findCaptain, findPiece, firstFixture, huntFixture, huntHint, illegalFeedback, MATH_TUTORIAL, piece, turnsFixture } from "./lesson";

export type LessonPhase = "active" | "rolling" | "explaining" | "moving" | "spent" | "feedback" | "returning" | "demonstrating" | "updated" | "introducing" | "revealing" | "won" | "completed" | "cancelled";
export interface LessonSnapshot {
  stage: number; phase: LessonPhase; board: MathWarState; selected: Position | null;
  revision: number; movement: MoveIntent | null; spawned: Position | null;
  attempts: number; guidance: number; feedback: string; spent: number;
  captainVisible: boolean; enemyVisible: boolean; captainCapture: boolean;
}

export class MathWarTutorialController {
  private session = new TutorialSession(MATH_TUTORIAL);
  private token: object = {};
  private listeners = new Set<() => void>();
  private canonical = firstFixture();
  private snapshot: LessonSnapshot = this.initial();
  constructor(private reducedMotion: () => boolean = () => false) {}
  private initial(): LessonSnapshot {
    return { stage: 1, phase: "active", board: this.canonical, selected: at(3, 3), revision: 0, movement: null, spawned: null, attempts: 0, guidance: 0, feedback: "", spent: 0, captainVisible: false, enemyVisible: false, captainCapture: false };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(update: Partial<LessonSnapshot>) { this.snapshot = { ...this.snapshot, ...update }; this.listeners.forEach(l => l()); }
  start = () => {
    this.token = this.session.start("1"); this.canonical = firstFixture();
    this.snapshot = { ...this.initial(), revision: this.snapshot.revision + 1 }; this.listeners.forEach(l => l());
  };
  dispose = () => this.session.cancel();
  setVisible = (visible: boolean) => this.session.setPaused(!visible);
  skip = () => { if (this.session.finish(this.token, "dismissed")) this.publish({ phase: "cancelled", movement: null }); };
  private enter(phase: LessonPhase, update: Partial<LessonSnapshot> = {}) {
    const token = this.session.enter(this.token, `${update.stage ?? this.snapshot.stage}:${phase}`, phase === "active" ? "active" : "resolving");
    if (!token) return false;
    this.token = token; this.publish({ phase, revision: this.snapshot.revision + 1, ...update }); return true;
  }
  private wait(ms: number, callback: () => void, reading = false) { this.session.wait(this.token, !reading && this.reducedMotion() ? 0 : ms, callback); }
  private exercise(stage: number, board: MathWarState, selected: Position | null) {
    this.canonical = board;
    this.enter("active", { stage, board, selected, attempts: 0, guidance: 0, feedback: "", movement: null, spawned: null, spent: 0 });
  }
  private roll(stage: 2 | 3, board: MathWarState, selected: Position) {
    this.canonical = { ...board, currentPlayer: 1, turnCount: 0, diceRoll: [2, 2] };
    this.enter("rolling", { stage, board: this.canonical, selected, movement: null, spent: 0, attempts: 0, guidance: 0 });
    this.wait(800, () => {
      this.enter("explaining");
      this.wait(1800, () => this.enter("active"), true);
    });
  }
  select = (position: Position | null) => {
    if (this.snapshot.phase !== "active" || !this.session.current(this.token)) return;
    if (!position || this.canonical.board[position.row]?.[position.col]?.owner === 1) this.publish({ selected: position });
  };
  hint = () => {
    if (this.snapshot.phase !== "active" || !this.session.current(this.token)) return;
    const objective = this.objective();
    this.publish({ guidance: Math.min(3, Math.max(2, this.snapshot.guidance + 1)), ...(objective ? { selected: objective.from } : {}) });
  };
  objective = (): MoveIntent | null => {
    const { stage, selected, captainCapture } = this.snapshot;
    if (stage === 6) return huntHint(this.canonical, selected);
    if (!selected) return null;
    if (stage === 4) return { from: at(3, 3), to: at(3, 5) };
    if (stage === 7 && captainCapture) {
      const enemy = findPiece(this.canonical, "target"); return enemy ? { from: selected, to: enemy } : null;
    }
    const action = getLegalActionsForPiece(this.canonical, selected, 1)[0];
    return action ? { from: action.from, to: action.to } : null;
  };
  private correction(message: string, preview?: MathWarState, movement?: MoveIntent) {
    const attempts = this.snapshot.attempts + 1;
    const selected = this.snapshot.selected;
    this.enter("feedback", { board: preview ?? this.canonical, selected: movement?.to ?? selected, movement: movement ?? null, feedback: message, attempts, guidance: Math.max(this.snapshot.guidance, attempts >= 3 ? 3 : attempts >= 2 ? 2 : 0) });
    this.wait(message.includes("⚡") ? 3200 : 2000, () => {
      const reverse = movement ? { from: movement.to, to: movement.from } : null;
      const recoverySelection = this.snapshot.stage === 6 && this.snapshot.guidance >= 2 ? this.objective()?.from ?? selected : selected;
      this.enter(reverse ? "returning" : "active", { board: this.canonical, selected: recoverySelection, movement: reverse, feedback: "" });
      if (reverse) this.wait(350, () => this.enter("active", { movement: null }));
    }, true);
  }
  attempt = (intent: MoveIntent) => {
    if (this.snapshot.phase !== "active" || !this.session.current(this.token)) return;
    const { stage, captainCapture } = this.snapshot;
    const action = resolveMoveIntent(this.canonical, intent, 1);
    if (!action) { this.correction(illegalFeedback(this.canonical, intent)); return; }
    const result = applyAction({ ...this.canonical, currentPlayer: 1 }, action, { nextDiceRoll: this.canonical.diceRoll });
    if (!result.ok) return;
    if (stage === 7 && !captainCapture && action.cost.distance !== 1) {
      this.correction("Ande uma casa com o Capitão.", result.state, intent); return;
    }
    if ((stage === 4 || (stage === 7 && captainCapture)) && action.type !== "capture") {
      this.correction("Capture a peça vermelha.", result.state, intent); return;
    }
    this.canonical = result.state;
    this.enter("moving", { board: result.state, selected: intent.to, movement: intent, spent: action.cost.totalCost });
    this.wait(350, () => {
      if (stage === 1) this.roll(2, result.state, intent.to);
      else if (stage === 6) {
        if (result.state.status === "ended") this.enter("won", { movement: null });
        else {
          // A practice turn, not a normal match: retain the move and offer another blue action.
          this.canonical = { ...result.state, currentPlayer: 1, turnCount: 0 };
          this.enter("active", { board: this.canonical, movement: null, attempts: 0, guidance: 0 });
        }
      } else this.enter("spent", { movement: null });
    });
  };
  continue = () => {
    const { stage, phase } = this.snapshot;
    if (!this.session.current(this.token)) return;
    if (phase === "spent") {
      if (stage === 2) this.roll(3, diagonalFixture(), at(3, 3));
      else if (stage === 3) this.exercise(4, captureFixture(), at(3, 3));
      else if (stage === 4) this.demonstrate();
      else if (stage === 7 && !this.snapshot.captainCapture) this.addCaptainTarget();
      else if (stage === 7) this.complete();
    } else if (stage === 5 && phase === "updated") this.introduceCaptain();
    else if (stage === 6 && phase === "won") this.exercise(7, captainFixture(), at(3, 3));
  };
  private demonstrate() {
    this.canonical = turnsFixture();
    this.enter("demonstrating", { stage: 5, board: this.canonical, selected: at(5, 2), spent: 0, movement: null, attempts: 0, guidance: 0 });
    const moves = [{ from: at(5, 2), to: at(4, 2) }, { from: at(2, 5), to: at(3, 5) }, { from: at(4, 2), to: at(4, 3) }];
    const play = (index: number) => {
      const action = resolveMoveIntent(this.canonical, moves[index]);
      if (!action) throw new Error("Illegal authored tutorial demonstration");
      const result = applyAction(this.canonical, action, { nextDiceRoll: [1, 2] });
      if (!result.ok) throw new Error("Failed tutorial demonstration");
      this.canonical = result.state;
      this.enter("demonstrating", { board: result.state, movement: moves[index], selected: moves[index].to });
      this.wait(350, () => {
        this.enter(index === 2 ? "rolling" : "demonstrating", { movement: null });
        this.wait(index === 2 ? 800 : 1300, () => {
          if (index < 2) play(index + 1);
          else this.enter("updated", { selected: at(4, 3) });
        }, index !== 2);
      });
    };
    this.wait(2200, () => play(0), true);
  }
  private introduceCaptain() {
    this.canonical = huntFixture();
    this.enter("introducing", { stage: 6, board: this.canonical, selected: null, movement: null, captainVisible: false, enemyVisible: false, guidance: 0, attempts: 0 });
    this.wait(2400, () => {
      const captain = findCaptain(this.canonical, 1);
      this.enter("revealing", { captainVisible: true, spawned: captain });
      this.wait(2000, () => {
        const board = this.canonical.board.map(row => row.map(p => p ? { ...p } : null));
        board[3][3] = piece("enemy-captain", 0, "sum", 2, true);
        this.canonical = { ...this.canonical, board };
        this.enter("revealing", { board: this.canonical, enemyVisible: true, selected: at(6, 3), spawned: at(3, 3) });
        this.wait(350, () => this.enter("active", { spawned: null }));
      }, true);
    }, true);
  }
  private addCaptainTarget() {
    const from = findPiece(this.canonical, "blue")!;
    const to = [at(from.row, from.col + 1), at(from.row, from.col - 1), at(from.row + 1, from.col)].find(p => p.row < 8 && p.col >= 0 && p.col < 8)!;
    const board = this.canonical.board.map(row => [...row]); board[to.row][to.col] = piece("target", 0);
    this.canonical = { ...this.canonical, board, currentPlayer: 1, turnCount: 0 };
    this.enter("active", { board: this.canonical, captainCapture: true, selected: from, spent: 0, attempts: 0, guidance: 0, spawned: to });
  }
  private complete() {
    if (!this.session.finish(this.token, "completed")) return;
    this.publish({ stage: 8, phase: "completed", board: createInitialState({ startingPlayer: 1, rng: () => 0, startingDiceRoll: [2, 2] }), selected: null, movement: null, spent: 0, revision: this.snapshot.revision + 1 });
  }
}
