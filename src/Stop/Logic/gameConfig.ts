/**
 * Game configuration for Stop Matemático
 * Defines difficulty levels with their calculation configurations
 */

import { range, stepRange, rangeWithSkip, stepRangeWithSkip } from "./numberUtils";

/**
 * Configuration for dual-box calculations (two operations in sequence)
 */
export type DualBoxConfig = {
  numbers1: number[];
  numbers2: number[];
  operations: [string, string];
};

/**
 * Difficulty configuration interface
 */
export interface DifficultyConfig {
  possibleNumbersByBox: number[][];
  contasPorBox: string[];
  possibleRandomNumbers: number[];
  dualBoxes: DualBoxConfig[];
}

/**
 * All difficulty configurations for Stop Matemático
 * d1 = Fácil 1, d2 = Fácil 2, d3 = Médio 1, d4 = Médio 2, d5 = Difícil 1, d6 = Difícil 2
 */
export const difficulties: Record<string, DifficultyConfig> = {
  d1: {
    possibleNumbersByBox: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [10],
      [0],
      [1, 2, 3],
      [4, 5, 6],
      [0],
    ],
    contasPorBox: ["+", "+", "+", "+", "+", "-", "-", "-", "-"],
    possibleRandomNumbers: [6, 7, 8, 9],
    dualBoxes: [],
  },
  d2: {
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
  },
  d3: {
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
  },
  d4: {
    possibleNumbersByBox: [
      rangeWithSkip(41, 99, [50, 60, 70, 80, 90]),
      [300, 400, 500, 600],
      [1000],
      [0, 1],
      range(2, 3),
      range(4, 5),
      [10],
    ],
    contasPorBox: ["+", "+", "+", "x", "x", "x", "x"],
    possibleRandomNumbers: range(5, 9),
    dualBoxes: [
      {
        numbers1: [20],
        numbers2: range(5, 9),
        operations: ["+", "-"],
      },
      {
        numbers1: [30],
        numbers2: range(11, 17),
        operations: ["+", "-"],
      },
      {
        numbers1: [3],
        numbers2: range(18, 23),
        operations: ["x", "-"],
      },
    ],
  },
  d5: {
    possibleNumbersByBox: [
      range(3, 5),
      range(6, 9),
      [10, 100],
      [1, 0],
      [1],
      [2, 3, 4, 5, 7],
    ],
    contasPorBox: ["x", "x", "x", "x", "÷", "÷"],
    possibleRandomNumbers: range(4, 9),
    dualBoxes: [
      {
        numbers1: [100],
        numbers2: range(11, 19),
        operations: ["+", "+"],
      },
      {
        numbers1: [30, 40, 50],
        numbers2: range(11, 19),
        operations: ["+", "-"],
      },
      {
        numbers1: [2, 3],
        numbers2: range(5, 9),
        operations: ["x", "-"],
      },
      {
        numbers1: [190, 290, 390],
        numbers2: [30, 40, 50, 60],
        operations: ["+", "-"],
      },
    ],
  },
  d6: {
    possibleNumbersByBox: [
      range(5, 9),
      [100, 1000],
      [0],
      [1],
      [2, 3, 4, 5, 7],
    ],
    contasPorBox: ["x", "x", "x", "÷", "÷"],
    possibleRandomNumbers: range(5, 9),
    dualBoxes: [
      {
        numbers1: [100],
        numbers2: rangeWithSkip(21, 39, [30]),
        operations: ["+", "+"],
      },
      {
        numbers1: [7, 12, 9],
        numbers2: [6, 13, 7, 5, 8, 17, 9, 19],
        operations: ["+", "÷"],
      },
      {
        numbers1: [60, 70, 80, 90],
        numbers2: range(17, 24),
        operations: ["+", "-"],
      },
      {
        numbers1: [4, 5, 6],
        numbers2: range(15, 22),
        operations: ["x", "-"],
      },
      {
        numbers1: [200, 300, 400, 270, 390, 460],
        numbers2: [40, 50, 60, 70],
        operations: ["+", "-"],
      },
    ],
  },
};

/**
 * Type for difficulty keys
 */
export type DifficultyKey = keyof typeof difficulties;
