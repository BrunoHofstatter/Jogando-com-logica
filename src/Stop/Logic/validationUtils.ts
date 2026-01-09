/**
 * Validation utilities for checking calculation answers
 */

/**
 * Check if two floating point numbers are close enough to be considered equal
 * @param a - First number
 * @param b - Second number
 * @param epsilon - Tolerance for comparison (default: 0.00001)
 * @returns True if numbers are within epsilon of each other
 */
export function isClose(a: number, b: number, epsilon = 0.00001): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Perform a calculation based on the operation
 * @param op - Operation symbol (+, -, x, ÷)
 * @param a - First operand
 * @param b - Second operand
 * @returns Result of the calculation
 */
export function calculate(op: string, a: number, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "x":
      return a * b;
    case "÷":
      return a / b;
    default:
      return NaN;
  }
}

/**
 * Validate a single calculation answer
 * @param operation - Operation symbol (+, -, x, ÷)
 * @param numero_base - Base number (magic number)
 * @param numero - Second operand
 * @param userAnswer - User's submitted answer
 * @returns Object with validation result and correct answer
 */
export function validateAnswer(
  operation: string,
  numero_base: number,
  numero: number,
  userAnswer: string
): { isCorrect: boolean; correctAnswer: number } {
  const correctAnswer = calculate(operation, numero_base, numero);
  const input = Number(userAnswer);

  // Use isClose for division operations to handle floating point precision
  const isCorrect = operation === "÷"
    ? isClose(input, correctAnswer)
    : input === correctAnswer;

  return { isCorrect, correctAnswer };
}

/**
 * Validate a dual calculation answer (two sequential operations)
 * @param operations - Array of two operation symbols
 * @param numero_base - Base number (magic number)
 * @param numeros - Array of two numbers for the operations
 * @param userAnswer - User's submitted answer
 * @returns Object with validation result and correct answer
 */
export function validateDualAnswer(
  operations: [string, string],
  numero_base: number,
  numeros: [number, number],
  userAnswer: string
): { isCorrect: boolean; correctAnswer: number } {
  // Perform first operation
  const intermediate = calculate(operations[0], numero_base, numeros[0]);

  // Perform second operation on intermediate result
  const finalResult = calculate(operations[1], intermediate, numeros[1]);

  const input = Number(userAnswer);

  // Use isClose for any operations involving division
  const hasDiv = operations.includes("÷");
  const isCorrect = hasDiv
    ? isClose(input, finalResult)
    : input === finalResult;

  return { isCorrect, correctAnswer: finalResult };
}
