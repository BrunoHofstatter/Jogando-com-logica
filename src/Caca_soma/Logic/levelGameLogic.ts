import { getPossibleSums } from './gameLogic';
import { LevelConfig } from './gameTypes';

export type SelectionRule = LevelConfig['numbersToSelect'] | 1;
type NumberRange = [number, number];

export const getSelectionCounts = (rule: SelectionRule): number[] =>
  rule === '2-or-3' ? [2, 3] : [rule];

export const acceptsSelectionCount = (rule: SelectionRule, count: number): boolean =>
  getSelectionCounts(rule).includes(count);

export const getLevelSelectionRule = (config: LevelConfig, remainingCells: number): SelectionRule =>
  config.completionRule === 'clear-board' && remainingCells === 1 ? 1 : config.numbersToSelect;

export const isLevelComplete = (config: LevelConfig, correctRounds: number, lockedCells: number): boolean =>
  config.completionRule === 'clear-board' ? lockedCells === config.boardSize ** 2 : correctRounds >= config.rounds;

export const createLevelRangeQueue = (config: LevelConfig, random: () => number = Math.random): NumberRange[] => {
  if (config.completionRule !== 'clear-board') return [];
  const queue = Array.from({ length: config.rangeCopies }, () => config.randomNumberRanges).flat()
    .map(([min, max]): NumberRange => [min, max]);
  for (let index = queue.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [queue[index], queue[other]] = [queue[other], queue[index]];
  }
  return queue;
};

const possibleLevelSums = (available: number[], rule: SelectionRule): number[] =>
  [...new Set(getSelectionCounts(rule).flatMap(count => [...getPossibleSums(available, count)]))];

const pickTarget = (possible: number[], range: NumberRange | null, previousTarget: number | undefined,
  random: () => number, allowRangeFallback = true): number | null => {
  const eligible = !allowRangeFallback && range
    ? possible.filter(sum => sum >= range[0] && sum <= range[1]) : possible;
  const different = eligible.filter(sum => sum !== previousTarget);
  const candidates = different.length ? different : eligible;
  const inRange = range ? candidates.filter(sum => sum >= range[0] && sum <= range[1]) : candidates;
  const pool = inRange.length ? inRange : candidates;
  return pool.length ? pool[Math.floor(random() * pool.length)] : null;
};

// Keep retries different whenever possible, even if that requires the existing
// out-of-range fallback. Never replace a solvable target with an impossible one.
export const chooseLevelTarget = (
  available: number[],
  rule: SelectionRule,
  range: [number, number],
  previousTarget?: number,
  random: () => number = Math.random,
): number | null => {
  return pickTarget(possibleLevelSums(available, rule), range, previousTarget, random);
};

// The boss consumes one shuffled entry per new round, never per wrong attempt.
// Unsolvable entries are skipped; exhausted queues use any remaining valid sum.
export const chooseNextLevelTarget = (
  config: LevelConfig, available: number[], roundNumber: number, rangeQueue: NumberRange[],
  previousTarget?: number, retryRange?: NumberRange, random: () => number = Math.random,
): { target: number | null; range: NumberRange; rangeQueue: NumberRange[] } => {
  if (config.completionRule !== 'clear-board') {
    const range = config.randomNumberRanges[roundNumber - 1];
    return { target: chooseLevelTarget(available, config.numbersToSelect, range, previousTarget, random), range, rangeQueue };
  }
  const possible = possibleLevelSums(available, getLevelSelectionRule(config, available.length));
  if (available.length === 1) {
    return { target: available[0], range: [available[0], available[0]], rangeQueue };
  }
  if (retryRange) {
    const target = pickTarget(possible, retryRange, previousTarget, random, false);
    if (target !== null) return { target, range: retryRange, rangeQueue };
  }
  const remaining = [...rangeQueue];
  while (remaining.length) {
    const range = remaining.shift()!;
    const target = pickTarget(possible, range, undefined, random, false);
    if (target !== null) return { target, range, rangeQueue: remaining };
  }
  const range: NumberRange = possible.length ? [Math.min(...possible), Math.max(...possible)] : [0, 0];
  return { target: pickTarget(possible, null, previousTarget, random), range, rangeQueue: remaining };
};

// Ceil prevents a result beyond a star deadline from looking within the deadline.
export const displayLevelSeconds = (seconds: number): number => Math.ceil(seconds);
