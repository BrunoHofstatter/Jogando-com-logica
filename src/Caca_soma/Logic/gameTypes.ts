// Type definitions for Caca Soma game modes

export type GameMode = 'versus' | 'level';

// Level configuration interface
export interface LevelConfig {
  levelId: number;
  boardSize: 5 | 7 | 10;                    // Board dimension (5x5=1-25, 7x7=1-49, 10x10=1-100)
  rounds: number;                           // Number of rounds in the level
  numbersToSelect: 2 | 3 | '2-or-3';         // Exact count, or either count
  randomNumberRanges: [number, number][];   // Array of ranges (one per round)
  starThresholds: {
    // Completing all rounds always earns one star; extra stars use active time.
    twoStarTime: number;                    // Max time (seconds) for 2 stars
    threeStarTime: number;                  // Max time (seconds) for 3 stars
  };
  description: string;                      // Portuguese description
  requiredStars: number;                    // Stars needed to unlock (0 for first level)
  columns?: number;                         // Optional override for grid columns
}

// Level progress tracking (stored in localStorage)
export interface LevelProgress {
  levelId: number;
  completed: boolean;
  bestStars: number;                        // 0-3
  bestTime: number;                         // In seconds
  bestCorrect: number;                      // Successfully solved rounds
  attempts: number;
  lastPlayed: string;                       // ISO date string
}

// Round result for level mode
export interface RoundResult {
  roundNumber: number;                      // Retries share their round number
  magicNumber: number;
  selectedNumbers: number[];
  sum: number;
  correct: boolean;
  timeTaken: number;                        // Seconds for this round
}

// Level attempt result
export interface LevelAttemptResult {
  levelId: number;
  rounds: RoundResult[];
  totalCorrect: number;
  totalTime: number;
  starsEarned: number;
  passed: boolean;                          // 2+ stars required
}
