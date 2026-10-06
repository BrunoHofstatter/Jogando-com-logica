import { LevelConfig } from './gameTypes';

type CampaignLevel = [
  levelId: number, boardSize: LevelConfig['boardSize'], numbersToSelect: LevelConfig['numbersToSelect'],
  ranges: [number, number][], twoStarTime: number, threeStarTime: number,
];

// Levels 1-10 retain their provisional 20% increase for completion and retries.
// Calibrate campaign and boss time goals through play-testing.
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
      twoStarTime: 108,
      threeStarTime: 72
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
      twoStarTime: 108,
      threeStarTime: 72
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2
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
      twoStarTime: 96,
      threeStarTime: 60
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2
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
      twoStarTime: 108,
      threeStarTime: 72
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2
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
      twoStarTime: 108,
      threeStarTime: 72
    },
    description: "Tabuleiro 5x5, soma de 2 números",
    requiredStars: 2
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
      twoStarTime: 108,
      threeStarTime: 72
    },
    description: "Tabuleiro 7x7, soma de 2 números",
    requiredStars: 2
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
      twoStarTime: 84,
      threeStarTime: 54
    },
    description: "Tabuleiro 7x7, soma de 2 números",
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
      twoStarTime: 108,
      threeStarTime: 72
    },
    description: "Tabuleiro 7x7, soma de 2 números",
    requiredStars: 2
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
      twoStarTime: 108,
      threeStarTime: 72
    },
    description: "Tabuleiro 7x7, soma de 2 números",
    requiredStars: 2
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
      twoStarTime: 108,
      threeStarTime: 72
    },
    description: "Tabuleiro 7x7, soma de 2 números",
    requiredStars: 2
  },
  // Authored campaign: varied pacing with a rough upward difficulty trend.
  ...([
    [11, 7, 2, [[15,25],[20,25],[25,30],[30,40],[35,45],[40,50]], 114, 76],
    [12, 7, 2, [[25,35],[35,45],[45,55],[55,65]], 60, 40],
    [13, 7, 2, [[20,30],[25,35],[30,40],[40,50],[45,55],[50,60]], 108, 72],
    [14, 7, 2, [[15,25],[15,25],[20,30],[20,30],[25,35],[25,35],[30,40]], 98, 63],
    [15, 7, 3, [[25,35],[30,40],[35,45],[45,55],[50,60],[55,65]], 108, 72],
    [16, 7, 3, [[25,35],[30,40],[35,45],[45,55],[50,60],[55,65]], 99, 70],
    [17, 7, 3, [[30,40],[35,45],[40,50],[50,60],[55,65],[60,70]], 102, 68],
    [18, 7, '2-or-3', [[30,40],[30,40],[35,45],[40,50],[50,60],[50,60],[55,65],[60,70]], 152, 104],
    [19, 7, '2-or-3', [[65,75],[25,35],[45,55],[35,45],[55,65],[30,40]], 102, 68],
    [20, 10, '2-or-3', [[35,45],[40,50],[45,55],[55,65],[60,70],[65,75]], 102, 68],
    [21, 10, 3, [[68,78],[30,40],[48,58],[40,50],[58,68]], 90, 60],
    [22, 10, '2-or-3', [[38,48],[43,53],[48,58],[58,68],[63,73],[68,78]], 102, 68],
    [23, 5, 2, [[20,30],[20,30],[20,30],[20,30]], 48, 32],
    [24, 10, '2-or-3', [[41,51],[46,56],[51,61],[61,71],[66,76],[71,81]], 102, 68],
    [25, 10, '2-or-3', [[44,54],[49,59],[54,64],[64,74],[69,79],[74,84]], 102, 68],
    [26, 10, '2-or-3', [[90,100],[100,110],[110,120],[120,130],[120,130]], 110, 80],
    [27, 10, '2-or-3', [[47,57],[52,62],[57,67],[67,77],[72,82],[77,87]], 102, 68],
    [28, 10, 2, [[100,110],[110,120],[120,130],[130,140],[130,140]], 120, 90],
    [29, 7, '2-or-3', [[60,70],[55,65],[50,60],[45,55],[45,55],[40,50],[35,45],[30,40]], 102, 68],
  ] satisfies CampaignLevel[]).map(([levelId, boardSize, numbersToSelect, randomNumberRanges, twoStarTime, threeStarTime]) => ({
    levelId, boardSize, numbersToSelect, randomNumberRanges,
    rounds: randomNumberRanges.length,
    starThresholds: { twoStarTime, threeStarTime },
    description: `Tabuleiro ${boardSize}x${boardSize}, soma de ${numbersToSelect === '2-or-3' ? '2 ou 3' : numbersToSelect} números`,
    requiredStars: 2,
  })),
  {
    levelId: 30,
    boardSize: 7,
    numbersToSelect: '2-or-3',
    completionRule: 'clear-board',
    rangeCopies: 3,
    randomNumberRanges: [[20,30],[31,40],[41,50],[51,60],[61,70],[71,80],[81,90]],
    // Provisional boss goals; calibrate alongside the rest of the campaign.
    starThresholds: { twoStarTime: 420, threeStarTime: 300 },
    description: 'Desafio final: marque todos os 49 números',
    requiredStars: 2,
  },
];

// Helper function to get a level by ID
export const getLevelById = (id: number): LevelConfig | undefined => {
  return levels.find(level => level.levelId === id);
};

// Get total number of levels
export const getTotalLevels = (): number => levels.length;
