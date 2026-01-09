// Type definitions for Caca Soma game modes

export type GameMode = 'versus' | 'level';

// Level configuration interface
export interface LevelConfig {
  levelId: number;
  boardSize: 5 | 7 | 10;                    // Board dimension (5x5=1-25, 7x7=1-49, 10x10=1-100)
  numbersToSelect: 2 | 3;                   // How many numbers must be selected
  randomNumberRanges: [number, number][];   // Array of 10 ranges (one per round)
  starThresholds: {
    oneStarCorrect: number;                 // Min correct answers for 1 star
    twoStarCorrect: number;                 // Min correct answers for 2 stars
    threeStarCorrect: number;               // Min correct answers for 3 stars
    oneStarTime: number;                    // Max time (seconds) for 1 star
    twoStarTime: number;                    // Max time (seconds) for 2 stars
    threeStarTime: number;                  // Max time (seconds) for 3 stars
  };
  description: string;                      // Portuguese description
  requiredStars: number;                    // Stars needed to unlock (0 for first level)
}

// Level progress tracking (stored in localStorage)
export interface LevelProgress {
  levelId: number;
  completed: boolean;
  bestStars: number;                        // 0-3
  bestTime: number;                         // In seconds
  bestCorrect: number;                      // Out of 10
  attempts: number;
  lastPlayed: string;                       // ISO date string
}

// Round result for level mode
export interface RoundResult {
  roundNumber: number;                      // 1-10
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
