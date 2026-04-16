import {
  difficulties,
  type DifficultyKey,
  type DualBoxConfig,
} from "./gameConfig";
import type { LevelConfig } from "./levelsConfig";
import { calculate, isClose } from "./validationUtils";

type RandomSource = () => number;

export interface StopRoundTemplate {
  possibleNumbersByBox: readonly number[][];
  contasPorBox: readonly string[];
  possibleRandomNumbers: readonly number[];
  dualBoxes: readonly DualBoxConfig[];
  columns: number;
  allowNegativeSubtraction: boolean;
}

type StopBoxBase = {
  id: string;
  points: number;
};

export type StopBox =
  | (StopBoxBase & {
      kind: "single";
      operation: string;
      operand: number;
    })
  | (StopBoxBase & {
      kind: "dual";
      operations: [string, string];
      operands: [number, number];
    });

export interface StopRound {
  magicNumber: number;
  boxes: StopBox[];
  columns: number;
}

export type StopBoxStatus = "correct" | "wrong" | "blank";

export interface StopBoxResult {
  boxId: string;
  answer: string;
  status: StopBoxStatus;
  isCorrect: boolean;
  correctAnswer: number;
  pointsValue: number;
  pointsAwarded: number;
}

export interface StopRoundResult {
  boxResults: StopBoxResult[];
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  answeredCount: number;
  totalPoints: number;
}

export function createStopRoundTemplateFromDifficulty(
  difficulty: DifficultyKey,
): StopRoundTemplate {
  const config = difficulties[difficulty];

  return {
    possibleNumbersByBox: config.possibleNumbersByBox,
    contasPorBox: config.contasPorBox,
    possibleRandomNumbers: config.possibleRandomNumbers,
    dualBoxes: config.dualBoxes,
    columns: difficulty === "d1" ? 4 : 5,
    allowNegativeSubtraction: difficulty === "d6",
  };
}

export function createStopRoundTemplateFromLevel(
  levelConfig: LevelConfig,
): StopRoundTemplate {
  return {
    possibleNumbersByBox: levelConfig.possibleNumbersByBox,
    contasPorBox: levelConfig.contasPorBox,
    possibleRandomNumbers: levelConfig.possibleRandomNumbers,
    dualBoxes: levelConfig.dualBoxes,
    columns: levelConfig.columns ?? 5,
    allowNegativeSubtraction: false,
  };
}

export function createStopRound(
  template: StopRoundTemplate,
  rng: RandomSource = Math.random,
): StopRound {
  const magicNumber = pickRandom(template.possibleRandomNumbers, rng);
  const shuffledSingles = shuffleSingleBoxTemplates(
    template.possibleNumbersByBox,
    template.contasPorBox,
    rng,
  );

  const singleBoxes: StopBox[] = shuffledSingles.map((singleBox, index) => ({
    id: `single-${index}`,
    kind: "single",
    operation: singleBox.operation,
    operand: getValidOperand(
      magicNumber,
      singleBox.operation,
      singleBox.options,
      template.allowNegativeSubtraction,
      rng,
    ),
    points: getSingleBoxPointValue(singleBox.operation),
  }));

  const dualBoxes: StopBox[] = template.dualBoxes.map((dualBox, index) => {
    const firstOperand = getValidOperand(
      magicNumber,
      dualBox.operations[0],
      dualBox.numbers1,
      template.allowNegativeSubtraction,
      rng,
    );
    const intermediate = calculate(
      dualBox.operations[0],
      magicNumber,
      firstOperand,
    );
    const secondOperand = getValidOperand(
      intermediate,
      dualBox.operations[1],
      dualBox.numbers2,
      template.allowNegativeSubtraction,
      rng,
    );

    return {
      id: `dual-${index}`,
      kind: "dual",
      operations: dualBox.operations,
      operands: [firstOperand, secondOperand],
      points: getDualBoxPointValue(dualBox.operations),
    };
  });

  return {
    magicNumber,
    boxes: [...singleBoxes, ...dualBoxes],
    columns: template.columns,
  };
}

export function isStopAnswerFilled(answer: string): boolean {
  return answer.trim().length > 0;
}

export function areAllStopAnswersFilled(answers: readonly string[]): boolean {
  return answers.every(isStopAnswerFilled);
}

export function getFirstBlankStopAnswerIndex(
  answers: readonly string[],
): number {
  return answers.findIndex((answer) => !isStopAnswerFilled(answer));
}

export function getStopBoxCorrectAnswer(
  magicNumber: number,
  box: StopBox,
): number {
  if (box.kind === "single") {
    return calculate(box.operation, magicNumber, box.operand);
  }

  const intermediate = calculate(box.operations[0], magicNumber, box.operands[0]);
  return calculate(box.operations[1], intermediate, box.operands[1]);
}

export function evaluateStopRound(
  round: StopRound,
  answers: readonly string[],
): StopRoundResult {
  const boxResults = round.boxes.map((box, index) =>
    evaluateStopBox(round.magicNumber, box, answers[index] ?? ""),
  );

  return {
    boxResults,
    correctCount: boxResults.filter((result) => result.status === "correct").length,
    wrongCount: boxResults.filter((result) => result.status === "wrong").length,
    blankCount: boxResults.filter((result) => result.status === "blank").length,
    answeredCount: boxResults.filter((result) => result.status !== "blank").length,
    totalPoints: boxResults.reduce(
      (total, result) => total + result.pointsAwarded,
      0,
    ),
  };
}

function evaluateStopBox(
  magicNumber: number,
  box: StopBox,
  rawAnswer: string,
): StopBoxResult {
  const answer = rawAnswer.trim();
  const correctAnswer = getStopBoxCorrectAnswer(magicNumber, box);

  if (!isStopAnswerFilled(answer)) {
    return {
      boxId: box.id,
      answer,
      status: "blank",
      isCorrect: false,
      correctAnswer,
      pointsValue: box.points,
      pointsAwarded: 0,
    };
  }

  const parsedAnswer = Number(answer);
  const usesTolerance =
    box.kind === "dual"
      ? box.operations.some(isDivisionOperation)
      : isDivisionOperation(box.operation);
  const isCorrect = usesTolerance
    ? isClose(parsedAnswer, correctAnswer)
    : parsedAnswer === correctAnswer;

  return {
    boxId: box.id,
    answer,
    status: isCorrect ? "correct" : "wrong",
    isCorrect,
    correctAnswer,
    pointsValue: box.points,
    pointsAwarded: isCorrect ? box.points : -box.points,
  };
}

function shuffleSingleBoxTemplates(
  possibleNumbersByBox: readonly number[][],
  contasPorBox: readonly string[],
  rng: RandomSource,
): Array<{ options: readonly number[]; operation: string }> {
  const pairCount = Math.min(possibleNumbersByBox.length, contasPorBox.length);
  const pairs = Array.from({ length: pairCount }, (_, index) => ({
    options: possibleNumbersByBox[index],
    operation: contasPorBox[index],
  }));

  for (let index = pairs.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [pairs[index], pairs[swapIndex]] = [pairs[swapIndex], pairs[index]];
  }

  return pairs;
}

function getValidOperand(
  baseNumber: number,
  operation: string,
  options: readonly number[],
  allowNegativeSubtraction: boolean,
  rng: RandomSource,
): number {
  let validOptions = [...options];

  if (isDivisionOperation(operation)) {
    validOptions = validOptions.filter(
      (value) => value !== 0 && baseNumber % value === 0,
    );
  } else if (operation === "-" && !allowNegativeSubtraction) {
    validOptions = validOptions.filter((value) => baseNumber - value >= 0);
  }

  if (validOptions.length === 0) {
    return baseNumber;
  }

  return pickRandom(validOptions, rng);
}

function getSingleBoxPointValue(operation: string): number {
  return isMultiplicationOperation(operation) || isDivisionOperation(operation)
    ? 2
    : 1;
}

function getDualBoxPointValue(operations: readonly string[]): number {
  return operations.some(isDivisionOperation) ? 4 : 3;
}

function isMultiplicationOperation(operation: string): boolean {
  return operation === "x";
}

function isDivisionOperation(operation: string): boolean {
  return operation === "÷" || operation === "Ã·";
}

function pickRandom<T>(
  values: readonly T[],
  rng: RandomSource,
): T {
  const index = Math.floor(rng() * values.length);
  return values[index];
}
