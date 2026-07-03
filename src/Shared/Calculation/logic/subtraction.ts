import type { CalculationCell, CalculationPlan, CalculationStep } from "../types";
import { answerCellId, borrowCellId } from "./cellIds";
import { numberToAnswerDigits, toDigits } from "./numberFormat";

export function buildSubtractionPlan(
  topNumber: number,
  bottomNumber: number,
  maxDigits: number,
): CalculationPlan {
  if (bottomNumber > topNumber) {
    return {
      operation: "subtraction",
      operands: [topNumber, bottomNumber],
      expectedAnswer: topNumber - bottomNumber,
      answerDigits: Array.from({ length: maxDigits }, () => " "),
      answerCellIds: Array.from({ length: maxDigits }, (_, column) => answerCellId(column)),
      processCells: [],
      steps: [],
      unsupportedReason: "negative",
    };
  }

  const expectedAnswer = topNumber - bottomNumber;
  const answerDigits = numberToAnswerDigits(expectedAnswer, maxDigits);
  const answerCellIds = answerDigits.map((_, column) => answerCellId(column));
  const workingTopDigits = toDigits(topNumber, maxDigits).map((digit) =>
    digit.trim() ? Number(digit) : 0,
  );
  const bottomDigits = toDigits(bottomNumber, maxDigits).map((digit) =>
    digit.trim() ? Number(digit) : 0,
  );
  const processCellsById = new Map<string, CalculationCell>();
  const steps: CalculationStep[] = [];

  for (let column = maxDigits - 1; column >= 0; column -= 1) {
    if (workingTopDigits[column] < bottomDigits[column]) {
      let borrowFrom = column - 1;

      while (borrowFrom >= 0 && workingTopDigits[borrowFrom] === 0) {
        borrowFrom -= 1;
      }

      if (borrowFrom >= 0) {
        for (let transferColumn = borrowFrom; transferColumn < column; transferColumn += 1) {
          workingTopDigits[transferColumn] -= 1;
          workingTopDigits[transferColumn + 1] += 10;
        }

        for (let changedColumn = borrowFrom; changedColumn <= column; changedColumn += 1) {
          const id = borrowCellId(changedColumn);
          const expected = workingTopDigits[changedColumn].toString();
          const message = `Escreva ${expected} como o novo valor desta coluna.`;

          processCellsById.set(id, {
            id,
            kind: "borrow",
            row: 0,
            column: changedColumn,
            expected,
            label: "empresta",
            message,
          });
          steps.push({
            cellId: id,
            expected,
            kind: "borrow",
            message,
          });
        }
      }
    }

    const resultDigit = workingTopDigits[column] - bottomDigits[column];
    const expectedDigit = resultDigit.toString();

    if (answerDigits[column].trim()) {
      steps.push({
        cellId: answerCellId(column),
        expected: expectedDigit,
        kind: "answer",
        message: `Escreva ${expectedDigit} no resultado desta coluna.`,
      });
    }
  }

  return {
    operation: "subtraction",
    operands: [topNumber, bottomNumber],
    expectedAnswer,
    answerDigits,
    answerCellIds,
    processCells: Array.from(processCellsById.values()).sort((a, b) => a.column - b.column),
    steps,
  };
}
