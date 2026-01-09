import { LevelConfig } from './gameTypes';

// Level configuration definitions
export const levels: LevelConfig[] = [
  {
    levelId: 1,
    boardSize: 5,
    numbersToSelect: 2,
    randomNumberRanges: [
      [3, 15],   // Round 1
      [3, 15],   // Round 2
      [5, 20],   // Round 3
      [5, 20],   // Round 4
      [5, 20],   // Round 5
      [8, 25],   // Round 6
      [8, 25],   // Round 7
      [8, 25],   // Round 8
      [10, 30],  // Round 9
      [10, 30]   // Round 10
    ],
    starThresholds: {
      oneStarCorrect: 5,
      twoStarCorrect: 7,
      threeStarCorrect: 9,
      oneStarTime: 120,      // 2 minutes
      twoStarTime: 90,       // 1.5 minutes
      threeStarTime: 60      // 1 minute
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 0  // First level always unlocked
  }
  // More levels can be added here
];

// Helper function to get a level by ID
export const getLevelById = (id: number): LevelConfig | undefined => {
  return levels.find(level => level.levelId === id);
};

// Get total number of levels
export const getTotalLevels = (): number => levels.length;
