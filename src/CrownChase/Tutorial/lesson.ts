import { applyAction, resolveMoveIntent } from "../Logic/v2";
import type { CrownChasePiece, CrownChaseState, MoveIntent, Position } from "../Logic/v2";
import type { TutorialIdentity } from "../../Shared/Tutorial/tutorialHistory";

// Materially redesigned lesson; existing v1 completion remains untouched.
export const CROWN_TUTORIAL: TutorialIdentity = { game: "crown-chase", scope: "core", version: 2 };
export const at = (row: number, col: number): Position => ({ row, col });
export const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col;
export type ActionStage = 1 | 2 | 3 | 4 | 6;
const inBounds = (p: Position) => p.row >= 0 && p.row < 5 && p.col >= 0 && p.col < 5;

export function practiceState(pieces: Array<CrownChasePiece & Position>): CrownChaseState {
  const board: CrownChaseState["board"] = Array.from({ length: 5 }, () => Array(5).fill(null));
  for (const { row, col, type, owner } of pieces) board[row][col] = { type, owner };
  return { board, currentPlayer: 1, turnCount: 0, status: "playing", winner: null, endReason: null, capturedByPlayer: [0, 0] };
}

export function initialPracticeState(): CrownChaseState {
  return practiceState([{ ...at(2, 2), type: "killer", owner: 1 }]);
}
export function jumperPracticeState(): CrownChaseState {
  return practiceState([{ ...at(2, 2), type: "jumper", owner: 1 }]);
}
export function kingsPracticeState(): CrownChaseState {
  return practiceState([{ ...at(4, 0), type: "king", owner: 1 }, { ...at(0, 4), type: "king", owner: 0 }]);
}
export function kingCaptureState(): CrownChaseState {
  const state = kingsPracticeState();
  state.board[0][3] = { type: "killer", owner: 0 };
  state.board[0][2] = { type: "jumper", owner: 1 };
  return state;
}

export function bluePiece(state: CrownChaseState): Position {
  for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
    const piece = state.board[row][col];
    if (piece?.owner === 1 && piece.type !== "king") return at(row, col);
  }
  return at(4, 0);
}
export function enemyPiece(state: CrownChaseState): Position | null {
  for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
    const piece = state.board[row][col];
    if (piece?.owner === 0 && piece.type !== "king") return at(row, col);
  }
  return null;
}

/** A new exercise setup, not an opponent turn or a competitive AI. */
export function supportSetup(state: CrownChaseState, stage: 2 | 4): { state: CrownChaseState; enemy: Position } {
  const from = bluePiece(state);
  const offsets = stage === 2
    ? [[-1, 1], [1, 1], [-1, -1], [1, -1], [0, 1], [-1, 0], [1, 0], [0, -1]]
    : [[0, 1], [-1, 0], [1, 0], [0, -1]];
  const direction = offsets.find(([dr, dc]) => inBounds(at(from.row + dr, from.col + dc)) &&
    (stage === 2 || inBounds(at(from.row + dr * 2, from.col + dc * 2))));
  if (!direction) throw new Error("No tutorial support placement");
  const enemy = at(from.row + direction[0], from.col + direction[1]);
  const next = practiceState([
    { ...from, type: stage === 2 ? "killer" : "jumper", owner: 1 },
    { ...enemy, type: stage === 2 ? "killer" : "jumper", owner: 0 },
  ]);
  next.turnCount = state.turnCount;
  next.capturedByPlayer = [...state.capturedByPlayer];
  return { state: next, enemy };
}

export function objectiveMove(stage: number, state: CrownChaseState): MoveIntent | null {
  const from = bluePiece(state);
  if (stage === 6) return { from, to: at(0, 4) };
  const enemy = enemyPiece(state);
  if (!enemy || (stage !== 2 && stage !== 4)) return null;
  return { from, to: stage === 2 ? enemy : at(enemy.row * 2 - from.row, enemy.col * 2 - from.col) };
}

export function perform(state: CrownChaseState, intent: MoveIntent): CrownChaseState | null {
  if (!inBounds(intent.from) || !inBounds(intent.to)) return null;
  const action = resolveMoveIntent(state, intent, 1);
  if (!action || state.board[intent.from.row][intent.from.col]?.owner !== 1) return null;
  const result = applyAction({ ...state, currentPlayer: 1 }, action);
  return result.ok ? result.state : null;
}

export function accepts(stage: number, state: CrownChaseState, intent: MoveIntent): boolean {
  if (stage === 1 || stage === 3) return samePosition(bluePiece(state), intent.from);
  const expected = objectiveMove(stage, state);
  return !!expected && samePosition(expected.from, intent.from) && samePosition(expected.to, intent.to);
}

export function explainIllegal(state: CrownChaseState, intent: MoveIntent): string {
  const piece = state.board[intent.from.row]?.[intent.from.col];
  if (!piece || piece.owner !== 1) return "Escolha sua peça azul.";
  if (piece.type === "king") return "O rei não se move.";
  if (state.board[intent.to.row]?.[intent.to.col]?.owner === 1) return "Essa casa já tem uma peça sua.";
  const dr = Math.abs(intent.from.row - intent.to.row), dc = Math.abs(intent.from.col - intent.to.col);
  if (piece.type === "killer") return "O Ninja anda só uma casa por vez.";
  if (dr && dc) return "O Saltador não anda na diagonal.";
  if (dr + dc > 2) return "Pule uma peça e caia logo depois dela.";
  if (dr + dc === 2 && !state.board[(intent.from.row + intent.to.row) / 2]?.[(intent.from.col + intent.to.col) / 2]) {
    return "Para saltar, precisa ter uma peça no meio.";
  }
  return "O Saltador só captura o rei.";
}
