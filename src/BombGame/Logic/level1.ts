export type BombRole = "bomb" | "manual";
export type Operator = "+" | "-" | "*";
export type Letter = "A" | "B" | "C" | "D";
export type SectionId = 1 | 2 | 3;

export interface ManualCalculation {
  letter: Letter;
  expression: string;
}

export interface Level1State {
  values: Record<Letter, number>;
  manualCalculations: ManualCalculation[];
  orderingNumbers: number[];
  orderingProgress: number[];
  numericAnswers: [number | null, number | null, number | null];
  operatorAnswers: [Operator | null, Operator | null, Operator | null];
  completedSections: SectionId[];
  lastEventId: number;
  lastMistake: MistakeTarget | null;
}

export interface MistakeTarget {
  section: SectionId;
  row: 0 | 1 | 2 | null;
  value: number | null;
}

export type Level1Intent =
  | { type: "select_ordering_number"; value: number }
  | { type: "submit_numeric_answer"; row: 0 | 1 | 2; value: number }
  | { type: "select_operator"; row: 0 | 1 | 2; value: Operator };

export interface IntentResult {
  accepted: boolean;
  mistake: boolean;
  completed: boolean;
}

const VALUE_RANGES: Record<Letter, readonly [number, number]> = {
  A: [2, 7],
  B: [5, 10],
  C: [1, 5],
  D: [11, 14],
};

export function createLevel1State(random: () => number = Math.random): Level1State {
  const values = Object.fromEntries(
    (Object.keys(VALUE_RANGES) as Letter[]).map((letter) => {
      const [minimum, maximum] = VALUE_RANGES[letter];
      return [letter, randomInteger(minimum, maximum, random)];
    }),
  ) as Record<Letter, number>;

  return {
    values,
    manualCalculations: (Object.keys(values) as Letter[]).map((letter) => ({
      letter,
      expression: createCalculation(values[letter], random),
    })),
    orderingNumbers: createOrderingNumbers(random),
    orderingProgress: [],
    numericAnswers: [null, null, null],
    operatorAnswers: [null, null, null],
    completedSections: [],
    lastEventId: 0,
    lastMistake: null,
  };
}

export function applyLevel1Intent(state: Level1State, intent: Level1Intent): IntentResult {
  if (intent.type === "select_ordering_number") {
    if (state.completedSections.includes(1) || state.orderingProgress.includes(intent.value)) {
      return rejected();
    }
    const sorted = [...state.orderingNumbers].sort((left, right) => left - right);
    const expected = sorted[state.orderingProgress.length];
    if (!state.orderingNumbers.includes(intent.value)) return rejected();
    if (intent.value !== expected) return mistake(state, { section: 1, row: null, value: intent.value });
    state.orderingProgress.push(intent.value);
    if (state.orderingProgress.length === sorted.length) completeSection(state, 1);
    return accepted(state);
  }

  if (intent.type === "submit_numeric_answer") {
    if (state.completedSections.includes(2) || state.numericAnswers[intent.row] !== null) {
      return rejected();
    }
    const expected = [
      state.values.A + state.values.B,
      state.values.B - state.values.C,
      state.values.C + state.values.A,
    ][intent.row];
    if (!Number.isInteger(intent.value) || intent.value !== expected) return mistake(state, { section: 2, row: intent.row, value: null });
    state.numericAnswers[intent.row] = intent.value;
    if (state.numericAnswers.every((answer) => answer !== null)) completeSection(state, 2);
    return accepted(state);
  }

  if (state.completedSections.includes(3) || state.operatorAnswers[intent.row] !== null) {
    return rejected();
  }
  const expected: Operator[] = ["+", "-", "-"];
  if (!["+", "-", "*"].includes(intent.value) || intent.value !== expected[intent.row]) {
    return mistake(state, { section: 3, row: intent.row, value: null });
  }
  state.operatorAnswers[intent.row] = intent.value;
  if (state.operatorAnswers.every((answer) => answer !== null)) completeSection(state, 3);
  return accepted(state);
}

function createCalculation(result: number, random: () => number): string {
  if (result > 1 && random() < 0.5) {
    const addend = randomInteger(1, Math.min(9, result - 1), random);
    return `${result - addend} + ${addend}`;
  }
  const subtrahend = randomInteger(1, 9, random);
  return `${result + subtrahend} − ${subtrahend}`;
}

function createOrderingNumbers(random: () => number): number[] {
  const bands: readonly (readonly [number, number])[] = [
    [3, 15], [16, 30], [31, 50], [51, 75], [76, 100], [101, 130], [131, 160],
  ];
  return shuffle(bands.map(([min, max]) => randomInteger(min, max, random)), random);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function randomInteger(minimum: number, maximum: number, random: () => number): number {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function mistake(state: Level1State, target: MistakeTarget): IntentResult {
  state.lastEventId += 1;
  state.lastMistake = target;
  return { accepted: true, mistake: true, completed: false };
}

function completeSection(state: Level1State, section: SectionId): void {
  state.completedSections.push(section);
  state.lastEventId += 1;
  state.lastMistake = null;
}

function accepted(state: Level1State): IntentResult {
  state.lastEventId += 1;
  state.lastMistake = null;
  return { accepted: true, mistake: false, completed: state.completedSections.length === 3 };
}

function rejected(): IntentResult {
  return { accepted: false, mistake: false, completed: false };
}
