/**
 * Utility functions for generating number ranges and sequences
 * Used in difficulty configurations
 */

/**
 * Generate an array of consecutive integers from start to end (inclusive)
 * @param start - Starting number
 * @param end - Ending number
 * @returns Array of numbers [start, start+1, ..., end]
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

/**
 * Generate an array of numbers with a specific step between them
 * @param start - Starting number
 * @param end - Ending number
 * @param step - Step size between numbers
 * @returns Array of numbers [start, start+step, start+2*step, ...]
 */
export function stepRange(start: number, end: number, step: number): number[] {
  const length = Math.floor((end - start) / step) + 1;
  return Array.from({ length }, (_, i) => start + i * step);
}

/**
 * Generate an array of consecutive integers, excluding specified values
 * @param start - Starting number
 * @param end - Ending number
 * @param skip - Array of numbers to exclude
 * @returns Array of numbers from start to end, excluding skip values
 */
export function rangeWithSkip(start: number, end: number, skip: number[]): number[] {
  const skipSet = new Set(skip);
  return range(start, end).filter((n) => !skipSet.has(n));
}

/**
 * Generate an array of numbers with a step, excluding specified values
 * Rounds results to 2 decimal places to handle floating point precision
 * @param start - Starting number
 * @param end - Ending number
 * @param step - Step size between numbers
 * @param skip - Array of numbers to exclude (default: empty)
 * @returns Array of stepped numbers, excluding skip values
 */
export function stepRangeWithSkip(
  start: number,
  end: number,
  step: number,
  skip: number[] = []
): number[] {
  const skipSet = new Set(skip);
  const length = Math.floor((end - start) / step) + 1;
  return Array.from({ length }, (_, i) => {
    const value = start + i * step;
    return Math.round(value * 100) / 100; // rounds to 2 decimal places
  }).filter((num) => !skipSet.has(num));
}
