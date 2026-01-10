import { GameState, TurnAction } from './types';
import { GameRules } from './types';

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
      return getDifficulty2Move(state, availableMoves, gameRules);
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
 * Level 2: Prioritized Heuristics
 * - Captures: 100% priority.
 *   - Captain capture: 1st priority.
 *   - Other captures: Random.
 * - No captures:
 *   - High Energy (>50% max energy): 80% priority.
 *   - Forward Movement (Down): 60% priority.
 */
const getDifficulty2Move = (state: GameState, moves: TurnAction[], gameRules: GameRules): TurnAction => {
  // 1. Capture Logic (100% priority)
  const captures = moves.filter(m => m.type === 'capture');

  if (captures.length > 0) {
    // Check for Captain capture
    const captainCaptures = captures.filter(m => m.capturedPiece?.data?.isCaptain);
    if (captainCaptures.length > 0) {
      return captainCaptures[0];
    }
    // Random capture
    return captures[Math.floor(Math.random() * captures.length)];
  }

  // 2. Movement Logic (No captures)
  let candidates = [...moves];

  // Calculate costs to identify High Energy moves
  // Max possible energy for AI (Player 0) is usually limited by dice + piece value.
  // Instead of recalculating max possible, we look at the costs of available moves.
  // We assume "most of the energy" means relative to what is possible *now*.
  // Or relative to the piece's energy capacity?
  // "if a piece can move 6 squares than 80% of the time it will move 4, 5 or 6."
  // This implies we filter for moves that use > 50% of the *piece's current energy*.

  // We need to calculate cost for each move.
  // Since we don't have easy access to `pieceEnergy` here without looking up the piece,
  // we can use `gameRules.calculateActionCost` if available, or assume standard costs.
  // MathWar uses `calculateActionCost` in rules.

  // Filter High Energy Moves (80% chance)
  if (Math.random() < 0.8) {
    const highEnergyMoves = candidates.filter(m => {
      // Calculate cost
      const cost = gameRules.calculateActionCost ? gameRules.calculateActionCost(state, m) : 0;
      // Get piece energy
      const piece = state.board[m.from!.row][m.from!.col];
      // piece.data.pieceEnergy should be populated by validateMove, but we are in getAIMove.
      // We might need to recalculate or check state.remainingEnergy if it was set?
      // Actually, `gameRules.validateMove` updates piece data, but `getAvailableActions` might not have called validateMove on the *state* persistently?
      // `getAvailableActions` calls `validateMove` on hypothetical moves.

      // Let's recalculate piece energy manually to be safe.
      const diceTotal = state.lastDiceRoll ? state.lastDiceRoll.reduce((sum, die) => sum + die, 0) : 0;
      const pieceEnergy = (piece?.value || 0) + diceTotal;

      return cost > (pieceEnergy / 2);
    });

    if (highEnergyMoves.length > 0) {
      candidates = highEnergyMoves;
    }
  }

  // Filter Forward Moves (60% chance)
  // AI is Player 0 (Top). Forward is Down (Row increasing).
  if (Math.random() < 0.6) {
    const forwardMoves = candidates.filter(m => m.to!.row > m.from!.row);
    if (forwardMoves.length > 0) {
      candidates = forwardMoves;
    }
  }

  // Pick random from remaining candidates
  return candidates[Math.floor(Math.random() * candidates.length)];
};
