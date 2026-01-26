import { range, rangeWithSkip, stepRangeWithSkip } from "./numberUtils";
import { DualBoxConfig } from "./gameConfig";

export interface StarCriteria {
    maxTime: number; // Seconds
    minCorrect: number; // Count
}

export interface LevelConfig {
    id: number;
    // Configuration properties (formerly from DifficultyConfig)
    possibleNumbersByBox: number[][];
    contasPorBox: string[];
    possibleRandomNumbers: number[];
    dualBoxes: DualBoxConfig[];

    // Layout config
    columns?: number; // Optional override for grid columns

    // progression
    stars: {
        1: StarCriteria;
        2: StarCriteria;
        3: StarCriteria;
    };
}

/**
 * Stop Game Levels Configuration
 * Fully decoupled from global difficulty configs for maximum customization
 */
export const levels: LevelConfig[] = [
    {
        id: 1,

        possibleNumbersByBox: [
            [1, 2],
            [3, 4],
            [5, 6],
            [10],
            [0],
            [1, 2, 3],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "-",],
        possibleRandomNumbers: [2, 3, 4],
        dualBoxes: [],
        columns: 3,

        stars: {
            1: { maxTime: 999, minCorrect: 1 },
            2: { maxTime: 100, minCorrect: 3 },
            3: { maxTime: 50, minCorrect: 5 },
        },
    },
    {
        id: 2,

        possibleNumbersByBox: [
            [2, 3],
            [5, 4],
            [6, 7],
            [10],
            [0],
            [4, 2, 3],
        ],
        contasPorBox: ["+", "+", "+", "+", "-", "-",],
        possibleRandomNumbers: [3, 4, 5],
        dualBoxes: [],
        columns: 3,

        stars: {
            1: { maxTime: 999, minCorrect: 1 },
            2: { maxTime: 80, minCorrect: 3 },
            3: { maxTime: 40, minCorrect: 5 },
        },
    },
    {
        id: 3,

        possibleNumbersByBox: [
            [3, 4],
            [5, 6],
            [7, 8],
            [9, 10],
            [20],
            [4, 2, 3],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "-"],
        possibleRandomNumbers: [3, 4, 5],
        dualBoxes: [],
        columns: 3,

        stars: {
            1: { maxTime: 999, minCorrect: 1 },
            2: { maxTime: 80, minCorrect: 3 },
            3: { maxTime: 40, minCorrect: 5 },
        },
    },
    {
        id: 4,

        possibleNumbersByBox: [
            [3, 4],
            [5, 6],
            [7, 8],
            [9, 10],
            [20],
            [0],
            [3, 4],
            [5, 6],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "-", "-", "-"],
        possibleRandomNumbers: [6, 7],
        dualBoxes: [],
        columns: 4,

        stars: {
            1: { maxTime: 999, minCorrect: 3 },
            2: { maxTime: 100, minCorrect: 5 },
            3: { maxTime: 50, minCorrect: 7 },
        },
    },
    {
        id: 5,

        possibleNumbersByBox: [
            [5, 4],
            [7, 6],
            [9, 8],
            [11, 12],
            [30],
            [100],
            [3, 4],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "+", "-"],
        possibleRandomNumbers: [4, 5],
        dualBoxes: [
            {
                numbers1: range(3, 5),
                numbers2: range(6, 9),
                operations: ["+", "-"],
            },
        ],

        columns: 4,

        stars: {
            1: { maxTime: 999, minCorrect: 3 },
            2: { maxTime: 100, minCorrect: 5 },
            3: { maxTime: 50, minCorrect: 7 },
        },
    },
    {
        id: 6,

        possibleNumbersByBox: [
            [3, 4],
            [5, 6],
            [7, 8],
            [9, 10],
            [30],
            [100],
            [5, 6, 7],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "+", "-"],
        possibleRandomNumbers: [6, 7],
        dualBoxes: [
            {
                numbers1: range(4, 6),
                numbers2: range(5, 8),
                operations: ["+", "-"],
            },
        ],

        columns: 4,

        stars: {
            1: { maxTime: 999, minCorrect: 3 },
            2: { maxTime: 80, minCorrect: 5 },
            3: { maxTime: 40, minCorrect: 7 },
        },
    },
    {
        id: 7,

        possibleNumbersByBox: [
            [5, 6],
            [7, 8],
            [9, 11],
            [12, 13],
            [50],
            [200],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "+"],
        possibleRandomNumbers: [4, 5],
        dualBoxes: [
            {
                numbers1: range(3, 5),
                numbers2: range(6, 9),
                operations: ["+", "-"],
            },
            {
                numbers1: range(6, 8),
                numbers2: range(10, 12),
                operations: ["+", "-"],
            },

        ],

        columns: 4,

        stars: {
            1: { maxTime: 999, minCorrect: 3 },
            2: { maxTime: 80, minCorrect: 5 },
            3: { maxTime: 40, minCorrect: 7 },
        },
    },
    {
        id: 8,

        possibleNumbersByBox: [
            [4, 5],
            [6, 7],
            [8, 9],
            [11, 12],
            [70],
            [300],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "+"],
        possibleRandomNumbers: [7, 8],
        dualBoxes: [
            {
                numbers1: range(3, 5),
                numbers2: range(8, 11),
                operations: ["+", "-"],
            },
            {
                numbers1: range(6, 8),
                numbers2: range(12, 14),
                operations: ["+", "-"],
            },

        ],

        columns: 4,

        stars: {
            1: { maxTime: 999, minCorrect: 3 },
            2: { maxTime: 80, minCorrect: 5 },
            3: { maxTime: 40, minCorrect: 7 },
        },
    },
    {
        id: 9,

        possibleNumbersByBox: [
            [4, 5],
            [6, 7],
            [8, 9],
            [11, 12],
            [20],
            [100],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "+"],
        possibleRandomNumbers: [4, 5],
        dualBoxes: [
            {
                numbers1: range(2, 4),
                numbers2: range(3, 5),
                operations: ["+", "-"],
            },
            {
                numbers1: range(4, 6),
                numbers2: range(5, 7),
                operations: ["+", "-"],
            },

        ],

        columns: 4,

        stars: {
            1: { maxTime: 999, minCorrect: 3 },
            2: { maxTime: 60, minCorrect: 5 },
            3: { maxTime: 30, minCorrect: 7 },
        },
    },
    {
        id: 10,

        possibleNumbersByBox: [
            [6, 7],
            [8, 9],
            [11, 12],
            [13, 14],
            [90],
            [1000],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "+"],
        possibleRandomNumbers: [6, 7],
        dualBoxes: [
            {
                numbers1: range(5, 7),
                numbers2: range(9, 11),
                operations: ["+", "-"],
            },
            {
                numbers1: range(8, 9),
                numbers2: range(12, 14),
                operations: ["+", "-"],
            },

        ],

        columns: 4,

        stars: {
            1: { maxTime: 999, minCorrect: 3 },
            2: { maxTime: 80, minCorrect: 5 },
            3: { maxTime: 40, minCorrect: 7 },
        },
    }
];

// Helper to get level by ID
export const getLevelById = (id: number): LevelConfig | undefined => {
    return levels.find((l) => l.id === id);
};

// Storage Keys
export const STORAGE_KEY_PREFIX = "stop_level_stars_";

export const getLevelStars = (levelId: number): number => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${levelId}`);
    return saved ? parseInt(saved, 10) : 0;
};

export const saveLevelStars = (levelId: number, stars: number) => {
    const current = getLevelStars(levelId);
    if (stars > current) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${levelId}`, stars.toString());
    }
};

export const isLevelUnlocked = (levelId: number): boolean => {
    if (levelId === 1) return true;
    // Level is unlocked if previous level has at least 2 stars
    const prevStars = getLevelStars(levelId - 1);
    return prevStars >= 2;
    return prevStars >= 2;
};

export const resetAllProgress = () => {
    levels.forEach(level => {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${level.id}`);
    });
};
