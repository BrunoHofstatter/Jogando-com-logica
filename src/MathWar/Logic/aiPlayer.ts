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
