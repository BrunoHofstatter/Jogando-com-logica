import type { CalculationCell, CalculationPlan, CalculationStep } from "../types";
import { answerCellId, carryCellId } from "./cellIds";
import { numberToAnswerDigits, toDigits } from "./numberFormat";

export function buildMultiplicationPlan(
  topNumber: number,
  bottomNumber: number,
  maxTopDigits: number,
): CalculationPlan {
  const expectedAnswer = topNumber * bottomNumber;
  const answerLength = maxTopDigits + 1;
  const answerDigits = numberToAnswerDigits(expectedAnswer, answerLength);
  const answerCellIds = answerDigits.map((_, column) => answerCellId(column));
  const topDigits = toDigits(topNumber, maxTopDigits);
  const processCells: CalculationCell[] = [];
  const steps: CalculationStep[] = [];

  let carry = 0;

  for (let topColumn = maxTopDigits - 1; topColumn >= 0; topColumn -= 1) {
    const digitText = topDigits[topColumn].trim();
    if (!digitText && carry === 0) {
      continue;
    }

    const digit = digitText ? Number(digitText) : 0;
    const total = digit * bottomNumber + carry;
    const resultDigit = total % 10;
    const nextCarry = Math.floor(total / 10);
    const answerColumn = topColumn + 1;
    const hasMoreTopDigits = topDigits
      .slice(0, topColumn)
      .some((topDigit) => topDigit.trim() !== "");

    steps.push({
      cellId: answerCellId(answerColumn),
      expected: resultDigit.toString(),
      kind: "answer",
      message: `Escreva ${resultDigit} no resultado desta coluna.`,
      guidance: {
        prompt: carry > 0
          ? `Multiplique ${bottomNumber} por ${digit} e some o número que você levou.`
          : `Comece por esta coluna: quanto é ${bottomNumber} × ${digit}?`,
        detail: carry > 0
          ? `${bottomNumber} × ${digit} = ${digit * bottomNumber}. Somando o ${carry} que foi levado, temos ${total}. Escreva ${resultDigit} aqui.`
          : `${bottomNumber} × ${digit} = ${total}. Escreva o ${resultDigit} no resultado desta coluna.`,
        equationPrefix: carry > 0
          ? `${bottomNumber} × ${digit} + ${carry} =`
          : `${bottomNumber} × ${digit} =`,
        leadingDigit: total >= 10 ? Math.floor(total / 10).toString() : undefined,
        resultDigit: resultDigit.toString(),
        leadingDestination: hasMoreTopDigits ? "carry" : "answer",
      },
    });

    if (nextCarry > 0 && hasMoreTopDigits) {
      const carryColumn = topColumn;
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
        guidance: {
          prompt: `O resultado tem ${nextCarry} dezena${nextCarry === 1 ? "" : "s"}. Onde ela deve ficar?`,
          detail: `Leve o ${nextCarry} para a pequena caixa acima da próxima coluna. Ele será somado no próximo passo.`,
          equationPrefix: `${bottomNumber} × ${digit} =`,
          leadingDigit: nextCarry.toString(),
          resultDigit: resultDigit.toString(),
          leadingDestination: "carry",
        },
      });
    }

    if (nextCarry > 0 && !hasMoreTopDigits) {
      steps.push({
        cellId: answerCellId(answerColumn - 1),
        expected: nextCarry.toString(),
        kind: "answer",
        message: `Escreva ${nextCarry} no começo do resultado.`,
        guidance: {
          prompt: `Falta registrar a dezena do ${total}.`,
          detail: `Como não há outra coluna para multiplicar, escreva o ${nextCarry} no começo do resultado.`,
          equationPrefix: carry > 0
            ? `${bottomNumber} × ${digit} + ${carry} =`
            : `${bottomNumber} × ${digit} =`,
          leadingDigit: nextCarry.toString(),
          resultDigit: resultDigit.toString(),
          leadingDestination: "answer",
        },
      });
    }

    carry = hasMoreTopDigits ? nextCarry : 0;
  }

  return {
    operation: "multiplication",
    operands: [topNumber, bottomNumber],
    expectedAnswer,
    answerDigits,
    answerCellIds,
    processCells,
    steps,
  };
}
