import { getPossibleSums } from './gameLogic';
import { LevelConfig } from './gameTypes';

export const getSelectionCounts = (rule: LevelConfig['numbersToSelect']): number[] =>
  rule === '2-or-3' ? [2, 3] : [rule];

export const acceptsSelectionCount = (rule: LevelConfig['numbersToSelect'], count: number): boolean =>
  getSelectionCounts(rule).includes(count);

// Keep retries different whenever possible, even if that requires the existing
// out-of-range fallback. Never replace a solvable target with an impossible one.
export const chooseLevelTarget = (
  available: number[],
  rule: LevelConfig['numbersToSelect'],
  range: [number, number],
  previousTarget?: number,
  random: () => number = Math.random,
): number | null => {
  const possible = [...new Set(getSelectionCounts(rule).flatMap(count => [...getPossibleSums(available, count)]))];
  const different = possible.filter(sum => sum !== previousTarget);
  const candidates = different.length ? different : possible;
  const inRange = candidates.filter(sum => sum >= range[0] && sum <= range[1]);
  const pool = inRange.length ? inRange : candidates;
  return pool.length ? pool[Math.floor(random() * pool.length)] : null;
};

// Ceil prevents a result beyond a star deadline from looking within the deadline.
export const displayLevelSeconds = (seconds: number): number => Math.ceil(seconds);
