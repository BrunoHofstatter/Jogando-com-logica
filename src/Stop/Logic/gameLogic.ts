/**
 * Game logic functions for Stop Matemático
 */

import type { DifficultyKey } from "./gameConfig";
import { difficulties } from "./gameConfig";

/**
 * Shuffle two arrays together, maintaining correspondence between elements
 * @param arr1 - First array to shuffle
 * @param arr2 - Second array to shuffle
 * @returns Tuple of shuffled arrays with maintained correspondence
 */
export function shuffleTogether<T, U>(
  arr1: readonly T[],
  arr2: readonly U[]
): [T[], U[]] {
  const indices = arr1.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffled1 = indices.map((i) => arr1[i]);
  const shuffled2 = indices.map((i) => arr2[i]);
  return [shuffled1, shuffled2];
}

/**
 * Format seconds into a readable time string
 * @param seconds - Number of seconds to format
 * @returns Formatted string like "30 segundos" or "2 minutos e 15 segundos"
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} segundos`;
  } else {
    const minutos = Math.floor(seconds / 60);
    const segundos = seconds % 60;
    return `${minutos} minuto${minutos > 1 ? "s" : ""} e ${segundos} segundo${
      segundos !== 1 ? "s" : ""
    }`;
  }
}

/**
 * Check if two floating point numbers are close enough
 * @param a - First number
 * @param b - Second number
 * @param epsilon - Tolerance for comparison
 * @returns True if numbers are within epsilon of each other
 */
function isClose(a: number, b: number, epsilon = 0.00001): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Get a valid number for a given operation and magic number
 * Ensures the operation produces valid results (e.g., no negative results in easy modes)
 * @param randomNumber - The magic number
 * @param conta - The operation (+, -, x, ÷)
 * @param options - Array of possible numbers to choose from
 * @param difficulty - Current difficulty level
 * @returns A valid number for the operation
 */
export function getValidNumber(
  randomNumber: number,
  conta: string,
  options: number[],
  difficulty: DifficultyKey
): number {
  let validOptions = options;

  if (conta === "÷") {
    // All difficulties require integer division results
    validOptions = options.filter((n) => n !== 0 && randomNumber % n === 0);
  } else if (conta === "-") {
    if (difficulty === "d6") {
      // Advanced difficulty allows negative results
      validOptions = options;
    } else {
      // Other difficulties require non-negative results
      validOptions = options.filter((n) => randomNumber - n >= 0);
    }
  }

  if (validOptions.length === 0) return randomNumber; // fallback
  const index = Math.floor(Math.random() * validOptions.length);
  return validOptions[index];
}
