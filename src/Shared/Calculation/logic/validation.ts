import type {
  CalculationCheckResult,
  CalculationMistake,
  CalculationPlan,
  ProcessValidation,
} from "../types";
import { answerDigitsToNumber } from "./numberFormat";

type CheckValues = {
  answerValues: Record<string, string>;
  processValues: Record<string, string>;
  processValidation: ProcessValidation;
  usedHints: number;
  attempts: number;
};

export function checkCalculationPlan(
  plan: CalculationPlan,
  values: CheckValues,
): CalculationCheckResult {
  const answerValues = plan.answerCellIds.map((id) => values.answerValues[id] ?? "");
  const finalAnswer = answerDigitsToNumber(answerValues);
  const answerCorrect = finalAnswer === plan.expectedAnswer;
  const mistakes: CalculationMistake[] = [];

  plan.answerCellIds.forEach((cellId, index) => {
    const expected = plan.answerDigits[index].trim();
    const actual = (values.answerValues[cellId] ?? "").trim();

    if (expected !== actual && (expected || actual)) {
      mistakes.push({
        cellId,
        kind: "answer",
        expected,
        actual,
        message: expected
          ? `O resultado desta coluna deveria ser ${expected}.`
          : "Este espaço deveria ficar vazio.",
      });
    }
  });

  let processCorrect = true;

  if (values.processValidation !== "ignore") {
    plan.processCells.forEach((cell) => {
      const actual = (values.processValues[cell.id] ?? "").trim();
      const expected = cell.expected.trim();

      if (actual !== expected) {
        processCorrect = false;
        mistakes.push({
          cellId: cell.id,
          kind: cell.kind,
          expected,
          actual,
          message: cell.message,
        });
      }
    });
  }

  const isCorrect =
    answerCorrect &&
    (values.processValidation === "require" ? processCorrect : true);

  return {
    isCorrect,
    answerCorrect,
    processCorrect,
    finalAnswer,
    expectedAnswer: plan.expectedAnswer,
    mistakes,
    usedHints: values.usedHints,
    attempts: values.attempts,
  };
}
