import { LevelConfig } from './gameTypes';

// Level configuration definitions
export const levels: LevelConfig[] = [
  {
    levelId: 1,
    boardSize: 5,
    rounds: 5,
    numbersToSelect: 2,
    randomNumberRanges: [
      [3, 15],
      [3, 15],
      [3, 15],
      [5, 20],
      [5, 20],
    ],
    starThresholds: {
      oneStarCorrect: 1,
      twoStarCorrect: 3,
      threeStarCorrect: 5,
      oneStarTime: 999,      // 2 minutes
      twoStarTime: 90,       // 1.5 minutes
      threeStarTime: 60      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 0  // First level always unlocked
  },
  {
    levelId: 2,
    boardSize: 5,
    rounds: 5,
    numbersToSelect: 2,
    randomNumberRanges: [
      [5, 15],
      [5, 15],
      [7, 20],
      [7, 20],
      [7, 20],
    ],
    starThresholds: {
      oneStarCorrect: 1,
      twoStarCorrect: 3,
      threeStarCorrect: 5,
      oneStarTime: 999,      // 2 minutes
      twoStarTime: 90,       // 1.5 minutes
      threeStarTime: 60      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2  // First level always unlocked
  }
  ,
  {
    levelId: 3,
    boardSize: 5,
    rounds: 5,
    numbersToSelect: 2,
    randomNumberRanges: [
      [5, 15],
      [5, 15],
      [7, 20],
      [7, 20],
      [7, 20],
    ],
    starThresholds: {
      oneStarCorrect: 1,
      twoStarCorrect: 3,
      threeStarCorrect: 5,
      oneStarTime: 999,      // 2 minutes
      twoStarTime: 80,       // 1.5 minutes
      threeStarTime: 50      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2  // First level always unlocked
  }
  ,
  {
    levelId: 4,
    boardSize: 5,
    rounds: 6,
    numbersToSelect: 2,
    randomNumberRanges: [
      [5, 15],
      [5, 15],
      [7, 20],
      [7, 20],
      [7, 20],
      [7, 20],
    ],
    starThresholds: {
      oneStarCorrect: 2,
      twoStarCorrect: 4,
      threeStarCorrect: 6,
      oneStarTime: 999,      // 2 minutes
      twoStarTime: 90,       // 1.5 minutes
      threeStarTime: 60      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2  // First level always unlocked
  }
  ,
  {
    levelId: 5,
    boardSize: 5,
    rounds: 6,
    numbersToSelect: 2,
    randomNumberRanges: [
      [7, 15],
      [7, 15],
      [9, 20],
      [10, 20],
      [10, 20],
      [11, 20],
    ],
    starThresholds: {
      oneStarCorrect: 2,
      twoStarCorrect: 4,
      threeStarCorrect: 6,
      oneStarTime: 999,      // 2 minutes
      twoStarTime: 90,       // 1.5 minutes
      threeStarTime: 60      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2  // First level always unlocked
  }
  ,
  {
    levelId: 6,
    boardSize: 7,
    rounds: 5,
    numbersToSelect: 2,
    randomNumberRanges: [
      [7, 15],
      [7, 15],
      [9, 20],
      [10, 20],
      [10, 25],
    ],
    starThresholds: {
      oneStarCorrect: 1,
      twoStarCorrect: 3,
      threeStarCorrect: 5,
      oneStarTime: 999,      // 2 minutes
      twoStarTime: 90,       // 1.5 minutes
      threeStarTime: 60      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2  // First level always unlocked
  }
  ,
  {
    levelId: 7,
    boardSize: 7,
    rounds: 5,
    numbersToSelect: 2,
    randomNumberRanges: [
      [5, 15],
      [5, 15],
      [7, 20],
      [7, 20],
      [7, 20],
    ],
    starThresholds: {
      oneStarCorrect: 1,
      twoStarCorrect: 3,
      threeStarCorrect: 5,
      oneStarTime: 999,
      twoStarTime: 70,
      threeStarTime: 45
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2
  }
  ,
  {
    levelId: 8,
    boardSize: 7,
    rounds: 6,
    numbersToSelect: 2,
    randomNumberRanges: [
      [7, 15],
      [7, 15],
      [9, 20],
      [10, 20],
      [10, 25],
      [11, 25],
    ],
    starThresholds: {
      oneStarCorrect: 2,
      twoStarCorrect: 4,
      threeStarCorrect: 6,
      oneStarTime: 999,
      twoStarTime: 90,
      threeStarTime: 60
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2  // First level always unlocked
  }
  ,
  {
    levelId: 9,
    boardSize: 7,
    rounds: 7,
    numbersToSelect: 2,
    randomNumberRanges: [
      [5, 15],
      [5, 15],
      [7, 20],
      [7, 25],
      [7, 30],
      [7, 30],
      [7, 40],
    ],
    starThresholds: {
      oneStarCorrect: 3,
      twoStarCorrect: 5,
      threeStarCorrect: 7,
      oneStarTime: 999,      // 2 minutes
      twoStarTime: 90,       // 1.5 minutes
      threeStarTime: 60      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2  // First level always unlocked
  }
  ,
  {
    levelId: 10,
    boardSize: 7,
    rounds: 5,
    numbersToSelect: 2,
    randomNumberRanges: [
      [10, 20],
      [15, 20],
      [20, 25],
      [30, 35],
      [30, 40],
    ],
    starThresholds: {
      oneStarCorrect: 1,
      twoStarCorrect: 3,
      threeStarCorrect: 5,
      oneStarTime: 999,      // 2 minutes
      twoStarTime: 90,       // 1.5 minutes
      threeStarTime: 60      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2  // First level always unlocked
  }
  // More levels can be added here
];

// Helper function to get a level by ID
export const getLevelById = (id: number): LevelConfig | undefined => {
  return levels.find(level => level.levelId === id);
};

// Get total number of levels
export const getTotalLevels = (): number => levels.length;
