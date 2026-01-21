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
            1: { maxTime: 999, minCorrect: 2 },
            2: { maxTime: 100, minCorrect: 4 },
            3: { maxTime: 50, minCorrect: 6 },
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
            1: { maxTime: 999, minCorrect: 2 },
            2: { maxTime: 80, minCorrect: 4 },
            3: { maxTime: 40, minCorrect: 6 },
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
            1: { maxTime: 999, minCorrect: 4 },
            2: { maxTime: 80, minCorrect: 6 },
            3: { maxTime: 40, minCorrect: 8 },
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
            [4, 2, 3],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "+", "-", "-"],
        possibleRandomNumbers: [6, 7],
        dualBoxes: [],
        columns: 4,

        stars: {
            1: { maxTime: 999, minCorrect: 2 },
            2: { maxTime: 80, minCorrect: 4 },
            3: { maxTime: 40, minCorrect: 6 },
        },
    },
    {
        id: 10,
        // Config similar to d2
        possibleNumbersByBox: [
            range(5, 10),
            range(11, 16),
            range(17, 23),
            [100],
            [20, 30, 40, 50],
            range(1, 4),
            range(1, 5),
            range(6, 9),
            [0],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "+", "-", "-", "-"],
        possibleRandomNumbers: range(6, 9),
        dualBoxes: [
            {
                numbers1: range(3, 6),
                numbers2: range(7, 13),
                operations: ["+", "-"],
            },
        ],

        stars: {
            1: { maxTime: 999, minCorrect: 5 },
            2: { maxTime: 60, minCorrect: 8 },
            3: { maxTime: 35, minCorrect: 10 },
        },
    },
    {
        id: 11,
        // Config similar to d3 (Medium 1)
        possibleNumbersByBox: [
            range(11, 19),
            rangeWithSkip(21, 39, [30]),
            [100],
            [70, 80, 90],
            rangeWithSkip(41, 69, [50, 60]),
            range(5, 18),
            [2],
            [0, 1],
        ],
        contasPorBox: ["+", "+", "+", "+", "+", "-", "x", "x"],
        possibleRandomNumbers: range(10, 18),
        dualBoxes: [
            {
                numbers1: [10],
                numbers2: range(11, 17),
                operations: ["+", "-"],
            },
            {
                numbers1: [20, 30],
                numbers2: range(18, 23),
                operations: ["+", "-"],
            },
        ],

        stars: {
            1: { maxTime: 999, minCorrect: 5 },
            2: { maxTime: 80, minCorrect: 8 },
            3: { maxTime: 50, minCorrect: 10 },
        },
    },
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
