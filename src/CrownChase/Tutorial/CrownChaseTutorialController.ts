import { TutorialSession } from "../../Shared/Tutorial/TutorialSession";
import { createInitialState } from "../Logic/v2";
import type { CrownChaseState, MoveIntent, Position } from "../Logic/v2";
import { accepts, bluePiece, CROWN_TUTORIAL, explainIllegal, initialPracticeState, jumperPracticeState, kingCaptureState, kingsPracticeState, perform, supportSetup } from "./lesson";

export type PracticePhase = "active" | "feedback" | "returning" | "moving" | "spawning" | "observation" | "kings" | "completed" | "cancelled";
export interface PracticeSnapshot {
  stage: number;
  phase: PracticePhase;
  board: CrownChaseState;
  feedback: string;
  guidance: number;
  attempts: number;
  revision: number;
  movement: MoveIntent | null;
  spawned: Position | null;
}

export class CrownChaseTutorialController {
  private readonly session = new TutorialSession(CROWN_TUTORIAL);
  private token: object = {};
  private listeners = new Set<() => void>();
  private canonical = initialPracticeState();
  private snapshot: PracticeSnapshot = this.initial();
  constructor(private readonly reducedMotion: () => boolean = () => false) {}
  private initial(): PracticeSnapshot {
    return { stage: 1, phase: "active", board: this.canonical, feedback: "", guidance: 0, attempts: 0, revision: 0, movement: null, spawned: null };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(update: Partial<PracticeSnapshot>) {
    this.snapshot = { ...this.snapshot, ...update };
    this.listeners.forEach(listener => listener());
  }
  start = () => {
    this.token = this.session.start("1:active");
    this.canonical = initialPracticeState();
    this.snapshot = { ...this.initial(), revision: this.snapshot.revision + 1 };
    this.listeners.forEach(listener => listener());
  };
  dispose = () => { this.session.cancel(); };
  setVisible = (visible: boolean) => this.session.setPaused(!visible);
  skip = () => {
    if (!this.session.finish(this.token, "dismissed")) return;
    this.publish({ phase: "cancelled", movement: null });
  };
  private enter(phase: PracticePhase, update: Partial<PracticeSnapshot> = {}) {
    const stage = update.stage ?? this.snapshot.stage;
    const token = this.session.enter(this.token, stage + ":" + phase,
      phase === "active" || phase === "kings" ? "active" : phase === "feedback" || phase === "observation" ? "resolving" : "transitioning");
    if (!token) return false;
    this.token = token;
    this.publish({ phase, revision: this.snapshot.revision + 1, ...update });
    return true;
  }
  private wait(milliseconds: number, callback: () => void, reading = false) {
    this.session.wait(this.token, !reading && this.reducedMotion() ? 0 : milliseconds, callback);
  }
  hint = () => {
    if (this.snapshot.phase === "active" && this.session.current(this.token) && [2, 4, 6].includes(this.snapshot.stage)) {
      this.publish({ guidance: Math.min(3, Math.max(2, this.snapshot.guidance + 1)) });
    }
  };
  selection = (position: Position, occupied = false) => {
    if (this.snapshot.phase !== "active" || !this.session.current(this.token)) return;
    const piece = this.canonical.board[position.row][position.col];
    if (piece?.owner === 0 || piece?.type === "king" || occupied) {
      this.showFeedback(piece?.type === "king" && piece.owner === 1 ? "O rei não se move." : occupied ? "Essa casa já tem uma peça sua." : "Escolha sua peça azul.");
    }
  };
  private showFeedback(text: string, preview?: CrownChaseState, movement?: MoveIntent, counted = false) {
    const attempts = this.snapshot.attempts + (counted ? 1 : 0);
    const guidance = Math.max(this.snapshot.guidance, attempts >= 3 ? 3 : attempts >= 2 ? 2 : 0);
    if (!this.enter("feedback", { board: preview ?? this.canonical, feedback: text, attempts, guidance, movement: movement ?? null })) return;
    this.wait(2000, () => {
      const reverse = movement ? { from: movement.to, to: movement.from } : null;
      if (!this.enter(reverse ? "returning" : "active", { board: this.canonical, feedback: "", movement: reverse, spawned: null })) return;
      if (reverse) this.wait(350, () => this.enter("active", { movement: null }));
    }, true);
  }
  attempt = (intent: MoveIntent) => {
    if (this.snapshot.phase !== "active" || !this.session.current(this.token)) return;
    const stage = this.snapshot.stage;
    const result = perform(this.canonical, intent);
    if (!result) {
      this.showFeedback(explainIllegal(this.canonical, intent), undefined, undefined, true);
      return;
    }
    if (!accepts(stage, this.canonical, intent)) {
      if (stage === 6) {
        this.showFeedback("Tente capturar o rei vermelho.", result, intent, true);
      } else {
        // Legal alternatives continue the exercise. Its supporting piece follows.
        const attempts = this.snapshot.attempts + 1;
        const guidance = Math.max(this.snapshot.guidance, attempts >= 3 ? 3 : attempts >= 2 ? 2 : 0);
        this.canonical = { ...result, currentPlayer: 1 };
        if (!this.enter("moving", { board: this.canonical, movement: intent, attempts, guidance })) return;
        this.wait(350, () => this.placeSupport(stage as 2 | 4));
      }
      return;
    }
    this.canonical = result;
    if (!this.enter("moving", { board: result, movement: intent, feedback: "" })) return;
    this.wait(350, () => {
      if (stage === 1) this.placeSupport(2, true);
      else if (stage === 2) this.newExercise(3, jumperPracticeState());
      else if (stage === 3) this.placeSupport(4, true);
      else if (stage === 4) {
        this.enter("observation", { movement: null, feedback: "A peça pulada fica no tabuleiro." });
        this.wait(3000, () => this.newExercise(5, kingsPracticeState()), true);
      } else if (stage === 6) {
        if (result.status !== "ended" || result.winner !== 1 || result.endReason !== "king_captured") return;
        if (!this.session.finish(this.token, "completed")) return;
        this.publish({ stage: 7, phase: "completed", board: createInitialState(), feedback: "", movement: null, spawned: null, revision: this.snapshot.revision + 1 });
      }
    });
  };
  private placeSupport(stage: 2 | 4, newStage = false) {
    const setup = supportSetup(this.canonical, stage);
    this.canonical = setup.state;
    if (!this.enter("spawning", { stage, board: setup.state, spawned: setup.enemy, movement: null,
      ...(newStage ? { attempts: 0, guidance: 0 } : {}) })) return;
    this.wait(300, () => this.enter("active", { spawned: null }));
  }
  private newExercise(stage: number, board: CrownChaseState) {
    this.canonical = board;
    this.enter(stage === 5 ? "kings" : "active", { stage, board, movement: null, spawned: stage === 3 ? bluePiece(board) : null, attempts: 0, guidance: 0, feedback: "" });
  }
  continue = () => {
    if (this.snapshot.phase === "kings" && this.session.current(this.token)) this.newExercise(6, kingCaptureState());
  };
}
