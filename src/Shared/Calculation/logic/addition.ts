import type { CalculationCell, CalculationPlan, CalculationStep } from "../types";
import { answerCellId, carryCellId } from "./cellIds";
import { numberToAnswerDigits, toDigits } from "./numberFormat";

export function buildAdditionPlan(numbers: number[], maxDigits: number): CalculationPlan {
  const expectedAnswer = numbers.reduce((sum, value) => sum + value, 0);
  const answerLength = maxDigits + 1;
  const answerDigits = numberToAnswerDigits(expectedAnswer, answerLength);
  const answerCellIds = answerDigits.map((_, column) => answerCellId(column));
  const operandDigits = numbers.map((value) => toDigits(value, maxDigits));
  const processCells: CalculationCell[] = [];
  const steps: CalculationStep[] = [];
  let carry = 0;

  for (let digitColumn = maxDigits - 1; digitColumn >= 0; digitColumn -= 1) {
    const columnSum =
      operandDigits.reduce((sum, digits) => {
        const digitText = digits[digitColumn].trim();
        return sum + (digitText ? Number(digitText) : 0);
      }, 0) + carry;

    const resultDigit = columnSum % 10;
    const nextCarry = Math.floor(columnSum / 10);
    const answerColumn = digitColumn + 1;

    if (answerDigits[answerColumn].trim()) {
      steps.push({
        cellId: answerCellId(answerColumn),
        expected: resultDigit.toString(),
        kind: "answer",
        message: `Escreva ${resultDigit} no resultado desta coluna.`,
      });
    }

    if (nextCarry > 0 && digitColumn > 0) {
      const carryColumn = digitColumn;
      const id = carryCellId(carryColumn);
      processCells.push({
        id,
        kind: "carry",
        row: 0,
        column: carryColumn,
        expected: nextCarry.toString(),
        label: "vai",
        message: `Suba o ${nextCarry} para a próxima coluna.`,
      });
      steps.push({
        cellId: id,
        expected: nextCarry.toString(),
        kind: "carry",
        message: `Suba o ${nextCarry} para a próxima coluna.`,
      });
    }

    if (nextCarry > 0 && digitColumn === 0) {
      steps.push({
        cellId: answerCellId(0),
        expected: nextCarry.toString(),
        kind: "answer",
        message: `Escreva ${nextCarry} no começo do resultado.`,
      });
    }

    carry = nextCarry;
  }

  return {
    operation: "addition",
    operands: numbers,
    expectedAnswer,
    answerDigits,
    answerCellIds,
    processCells,
    steps,
  };
}
