import { describe, expect, it } from 'vitest';
import { acceptsSelectionCount, chooseLevelTarget, chooseNextLevelTarget, createLevelRangeQueue,
  displayLevelSeconds, getLevelSelectionRule, getSelectionCounts, isLevelComplete } from './levelGameLogic';
import { calculateStars } from './levelProgress';
import { levels } from './levelConfigs';

describe('solo target generation', () => {
  it('changes a retry target while keeping the required count and remaining cells solvable', () => {
    expect(chooseLevelTarget([1, 2, 4], 2, [3, 6], 3, () => 0)).toBe(5);
    expect(chooseLevelTarget([1, 2, 4, 8], 3, [7, 14], 7, () => 0)).toBe(11);
  });
  it('uses a different out-of-range sum when the previous target is the only in-range sum', () => {
    expect(chooseLevelTarget([1, 2, 4], 2, [3, 3], 3, () => 0)).toBe(5);
  });
  it('reuses the sole remaining solvable target, and never invents an impossible target', () => {
    expect(chooseLevelTarget([1, 2], 2, [3, 15], 3)).toBe(3);
    expect(chooseLevelTarget([1], 2, [3, 15])).toBeNull();
  });
  it('allows optional pairs and triples while enforcing exact mandatory counts', () => {
    expect(acceptsSelectionCount(3, 2)).toBe(false);
    expect(acceptsSelectionCount(3, 3)).toBe(true);
    expect(acceptsSelectionCount('2-or-3', 2)).toBe(true);
    expect(acceptsSelectionCount('2-or-3', 3)).toBe(true);
    expect(acceptsSelectionCount('2-or-3', 1)).toBe(false);
    expect(chooseLevelTarget([1, 2, 4], '2-or-3', [7, 7])).toBe(7);
  });
});

describe('completion and time-only rewards', () => {
  it('requires all rounds, awards one star without a deadline, and uses inclusive precise time goals', () => {
    const level = levels[0];
    if (level.completionRule === 'clear-board') throw new Error('Expected a fixed-round level');
    expect(calculateStars(level.rounds - 1, 1, level.levelId)).toBe(0);
    expect(calculateStars(level.rounds, 5000, level.levelId)).toBe(1);
    expect(calculateStars(level.rounds, level.starThresholds.threeStarTime, level.levelId)).toBe(3);
    expect(calculateStars(level.rounds, level.starThresholds.threeStarTime + 0.001, level.levelId)).toBe(2);
    expect(calculateStars(level.rounds, level.starThresholds.twoStarTime, level.levelId)).toBe(2);
    expect(calculateStars(level.rounds, level.starThresholds.twoStarTime + 0.001, level.levelId)).toBe(1);
    expect(calculateStars(level.rounds, NaN, level.levelId)).toBe(0);
  });
  it('displays whole seconds without making a missed deadline look achieved', () => {
    expect(displayLevelSeconds(0)).toBe(0);
    expect(displayLevelSeconds(72)).toBe(72);
    expect(displayLevelSeconds(72.001)).toBe(73);
  });
});

describe('board-clearing boss', () => {
  const boss = levels[29];
  it('shuffles 21 entries, with exactly three of each range, without changing the configuration', () => {
    const queue = createLevelRangeQueue(boss, () => 0);
    expect(queue).toHaveLength(21);
    for (const range of boss.randomNumberRanges) {
      expect(queue.filter(entry => entry.join() === range.join())).toHaveLength(3);
    }
    expect(queue.slice(0, 7)).not.toEqual(boss.randomNumberRanges);
    expect(boss.randomNumberRanges).toHaveLength(7);
    expect(createLevelRangeQueue(levels[0])).toEqual([]);
  });

  it('skips impossible ranges and retains the active range and queue on wrong retries', () => {
    const next = chooseNextLevelTarget(boss, [1, 2, 4, 8], 1, [[90, 100], [3, 15], [31, 40]], undefined, undefined, () => 0);
    expect(next.target).toBe(3);
    expect(next.range).toEqual([3, 15]);
    expect(next.rangeQueue).toEqual([[31, 40]]);
    const retry = chooseNextLevelTarget(boss, [1, 2, 4, 8], 1, next.rangeQueue, next.target!, next.range, () => 0);
    expect(retry.target).not.toBe(next.target);
    expect(retry.range).toEqual(next.range);
    expect(retry.rangeQueue).toEqual(next.rangeQueue);
    const sole = chooseNextLevelTarget(boss, [1, 2], 1, [[31, 40]], 3, [3, 3], () => 0);
    expect(sole.target).toBe(3);
    expect(sole.rangeQueue).toEqual([[31, 40]]);
  });

  it('falls back to remaining sums and allows a single cell only in the boss finale', () => {
    expect(chooseNextLevelTarget(boss, [40, 49], 22, [], undefined, undefined, () => 0).target).toBe(89);
    const final = chooseNextLevelTarget(boss, [49], 25, [[20, 30]], undefined, undefined, () => 0);
    expect(final.target).toBe(49);
    expect(final.range).toEqual([49, 49]);
    expect(getLevelSelectionRule(boss, 1)).toBe(1);
    expect(getLevelSelectionRule(boss, 2)).toBe('2-or-3');
    expect(getLevelSelectionRule(levels[0], 1)).toBe(2);
    expect(acceptsSelectionCount(1, 1)).toBe(true);
    expect(acceptsSelectionCount(1, 2)).toBe(false);
  });

  it('awards stars only after the whole board is cleared, regardless of round count', () => {
    expect(calculateStars(25, 1, 30, 48)).toBe(0);
    expect(calculateStars(17, 300, 30, 49)).toBe(3);
    expect(calculateStars(25, 300.001, 30, 49)).toBe(2);
    expect(calculateStars(17, 420, 30, 49)).toBe(2);
    expect(calculateStars(25, 420.001, 30, 49)).toBe(1);
  });
});

// Exercise every authored level with different targets and valid cell choices,
// including depleted boards, optional counts, and the boss's variable ending.
describe('campaign solvability', () => {
  function solution(available: number[], count: number, target: number, start = 0): number[] | null {
    if (count === 0) return target === 0 ? [] : null;
    for (let index = start; index <= available.length - count; index++) {
      const rest = solution(available, count - 1, target - available[index], index + 1);
      if (rest) return [available[index], ...rest];
    }
    return null;
  }

  it('can complete all 30 levels without reusing a cell or producing an impossible target', () => {
    expect(levels.map(level => level.levelId)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
    for (let seed = 1; seed <= 8; seed++) {
      let state = seed;
      const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 2 ** 32; };
      for (const level of levels) {
        let available = Array.from({ length: level.boardSize ** 2 }, (_, index) => index + 1);
        let queue = createLevelRangeQueue(level, random);
        let correct = 0;
        while (!isLevelComplete(level, correct, level.boardSize ** 2 - available.length)) {
          expect(correct).toBeLessThan(26);
          const next = chooseNextLevelTarget(level, available, correct + 1, queue, undefined, undefined, random);
          expect(next.target, `Level ${level.levelId}, round ${correct + 1}`).not.toBeNull();
          const counts = getSelectionCounts(getLevelSelectionRule(level, available.length));
          if (seed % 2 === 0) counts.reverse();
          const selected = counts.map(count => solution(available, count, next.target!)).find(Boolean);
          expect(selected).toBeTruthy();
          available = available.filter(number => !selected!.includes(number));
          queue = next.rangeQueue;
          correct++;
        }
        if (level.completionRule === 'clear-board') expect(available).toEqual([]);
        else expect(correct).toBe(level.rounds);
      }
    }
  });
});
