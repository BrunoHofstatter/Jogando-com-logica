import { createEmptyBoard, createInitialState, createState, evaluateMove, getLegalActions, getPieceAvailableEnergy, resolveMoveIntent } from "../Logic/v2";
import type { DiceRoll, MathWarPiece, MathWarState, MoveIntent, Position } from "../Logic/v2";
import type { TutorialIdentity } from "../../Shared/Tutorial/tutorialHistory";

export const MATH_TUTORIAL: TutorialIdentity = { game: "math-war", scope: "core", version: 1 };
export const at = (row: number, col: number): Position => ({ row, col });
export const samePosition = (a: Position | null, b: Position | null) => !!a && !!b && a.row === b.row && a.col === b.col;
export const piece = (id: string, owner: 0 | 1, type: MathWarPiece["type"] = "sum", value: 2 | 3 | 4 = 2, isCaptain = false): MathWarPiece => ({ id, owner, type, value, isCaptain });

export function fixture(placements: Array<{ position: Position; piece: MathWarPiece }>, diceRoll: DiceRoll = [2, 2]): MathWarState {
  const board = createEmptyBoard();
  placements.forEach(({ position, piece }) => { board[position.row][position.col] = piece; });
  return createState({ board, currentPlayer: 1, diceRoll });
}
// Hidden introductory dice allow every square on the four clear movement rays.
export const firstFixture = () => fixture([{ position: at(3, 3), piece: piece("blue", 1) }], [5, 5]);
export const diagonalFixture = () => fixture([{ position: at(3, 3), piece: piece("blue", 1, "sumDiag") }]);
export const captureFixture = () => fixture([
  { position: at(3, 3), piece: piece("blue", 1) },
  { position: at(3, 5), piece: piece("near", 0) },
  { position: at(0, 3), piece: piece("far", 0) },
]);
export const turnsFixture = () => ({ ...fixture([
  { position: at(5, 2), piece: piece("blue", 1) },
  { position: at(2, 5), piece: piece("red", 0) },
], [3, 4]), currentPlayer: 0 as const });
export const captainFixture = () => fixture([
  { position: at(3, 3), piece: piece("blue", 1, "sum", 2, true) },
  { position: at(3, 4), piece: piece("target", 0) },
], [3, 3]);

export function huntFixture(): MathWarState {
  const state = createInitialState({ startingPlayer: 1, rng: () => 0, startingDiceRoll: [3, 4] });
  state.board = state.board.map(row => row.map(p => p?.owner === 1 ? p : null));
  return state;
}
export function findPiece(state: MathWarState, id: string): Position | null {
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) if (state.board[row][col]?.id === id) return at(row, col);
  return null;
}
export function findCaptain(state: MathWarState, owner: 0 | 1): Position | null {
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const p = state.board[row][col];
    if (p?.owner === owner && p.isCaptain) return at(row, col);
  }
  return null;
}

export interface CostLabel { position: Position; cost: number; affordable: boolean; capture: boolean }
/** Continue beyond unaffordable empty squares, but never beyond an occupied square. */
export function costLabels(state: MathWarState, from: Position | null): CostLabel[] {
  const p = from ? state.board[from.row]?.[from.col] : null;
  if (!from || !p || p.owner !== 1 || state.status !== "playing") return [];
  const directions = p.type === "sum" ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const labels: CostLabel[] = [];
  for (const [dr, dc] of directions) for (let distance = 1; distance < 8; distance++) {
    const to = at(from.row + dr * distance, from.col + dc * distance);
    if (to.row < 0 || to.row >= 8 || to.col < 0 || to.col >= 8) break;
    const target = state.board[to.row][to.col];
    if (target?.owner === 1) break;
    const evaluation = evaluateMove(state, { from, to }, 1);
    labels.push({ position: to, cost: evaluation.requiredEnergy, affordable: evaluation.isValid, capture: !!target });
    if (target) break;
  }
  return labels;
}

export function illegalFeedback(state: MathWarState, intent: MoveIntent): string {
  const e = evaluateMove(state, intent, 1);
  switch (e.invalidReason) {
    case "insufficient_energy": return `Precisa de ${e.requiredEnergy} ⚡. Você tem ${e.availableEnergy}.`;
    default: return "A peça não pode ir aí.";
  }
}

/** A useful legal next step toward the Captain, without moving any piece for the child. */
export function huntHint(state: MathWarState, selected: Position | null): MoveIntent | null {
  const legal = getLegalActions(state, 1);
  const capture = legal.find(a => a.capturedPiece?.isCaptain && samePosition(a.from, selected)) ?? legal.find(a => a.capturedPiece?.isCaptain);
  if (capture) return { from: capture.from, to: capture.to };
  const target = findCaptain(state, 0);
  if (!target) return null;
  const sources = legal.map(a => a.from).filter((p, i, all) => all.findIndex(q => samePosition(p, q)) === i);
  sources.sort((a, b) => Number(samePosition(b, selected)) - Number(samePosition(a, selected)));
  for (const from of sources) {
    const mover = state.board[from.row][from.col]!;
    const queue: Array<{ position: Position; first: MoveIntent | null }> = [{ position: from, first: null }];
    const seen = new Set([`${from.row}:${from.col}`]);
    for (let i = 0; i < queue.length; i++) {
      const current = queue[i];
      const board = state.board.map(row => [...row]);
      board[from.row][from.col] = null;
      board[current.position.row][current.position.col] = mover;
      const candidate = { ...state, board, currentPlayer: 1 as const };
      if (resolveMoveIntent(candidate, { from: current.position, to: target }, 1)) return current.first ?? { from, to: target };
      for (const label of costLabels(candidate, current.position)) {
        const key = `${label.position.row}:${label.position.col}`;
        if (!label.affordable || label.capture || seen.has(key)) continue;
        seen.add(key);
        queue.push({ position: label.position, first: current.first ?? { from, to: label.position } });
      }
    }
  }
  return null;
}

export function energy(state: MathWarState, selected: Position | null) { return getPieceAvailableEnergy(state, selected); }
