import { describe, expect, it } from 'vitest';
import { acceptsSelectionCount, chooseLevelTarget, displayLevelSeconds } from './levelGameLogic';
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
  const level = levels[0];
  it('requires all rounds, awards one star without a deadline, and uses inclusive precise time goals', () => {
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
