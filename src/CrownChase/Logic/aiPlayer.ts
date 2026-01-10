import { GameState, TurnAction } from '../../AA_baseGame/Logic/types';
import { GameRules } from '../../AA_baseGame/Logic/types';

export type AIDifficulty = 1 | 2 | 3 | 4 | 5;

/**
 * Get the AI's move based on difficulty level
 * @param state Current game state
 * @param gameRules Game rules for getting available actions
 * @param difficulty AI difficulty level (1 = Easy/Random)
 * @returns The selected action for the AI to execute
 */
export const getAIMove = (
  state: GameState,
  gameRules: GameRules,
  difficulty: AIDifficulty = 1
): TurnAction => {
  const availableMoves = gameRules.getAvailableActions(state);

  if (availableMoves.length === 0) {
    throw new Error("No available moves for AI");
  }

  switch(difficulty) {
    case 1:
      return getRandomMove(availableMoves);
    case 2:
      return getDifficulty2Move(state, availableMoves);
    default:
      // For now, only Level 1 is implemented
      return getRandomMove(availableMoves);
  }
};

/**
 * Level 1: Random move selection
 * Picks a random move from all available legal moves
 */
const getRandomMove = (moves: TurnAction[]): TurnAction => {
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
};

/**
 * Level 2: Simple Heuristics
 * - 80% chance to capture if available
 * - If no capture (or missed chance), prioritize forward movement (70% chance)
 */
const getDifficulty2Move = (state: GameState, moves: TurnAction[]): TurnAction => {
  const captures = moves.filter(m => m.type === 'capture');

  // 1. Capture Logic (80% chance)
  if (captures.length > 0) {
    if (Math.random() < 0.8) {
      // Pick random capture
      return captures[Math.floor(Math.random() * captures.length)];
    }
  }

  // 2. Forward Movement Logic
  // CrownChase AI is Player 0 (Top, Row 0). Forward is increasing Row (Down).
  // "Prioritizing going forward (meaning going down or to the left in this case)"
  // Wait, user said "going down or to the left".
  // Top-Right (0, 4) to Bottom-Left (4, 0).
  // Down = Row increases. Left = Col decreases.

  const forwardMoves = moves.filter(m => {
    if (!m.from || !m.to) return false;
    return m.to.row > m.from.row || m.to.col < m.from.col;
  });

  if (forwardMoves.length > 0) {
    // 70% chance to pick forward move
    if (Math.random() < 0.7) {
      return forwardMoves[Math.floor(Math.random() * forwardMoves.length)];
    }
  }

  // 3. Fallback: Random move (from all available moves, including captures if we skipped them)
  return getRandomMove(moves);
};
