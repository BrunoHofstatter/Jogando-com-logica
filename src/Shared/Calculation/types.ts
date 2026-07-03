export type CalculationOperation = "addition" | "subtraction" | "multiplication";

export type GuidanceMode = "free" | "assisted" | "locked";

export type ProcessValidation = "ignore" | "warn" | "require";

export type KeypadMode = "auto" | "visible" | "toggle" | "hidden";

export type CalculationCellKind =
  | "operand"
  | "answer"
  | "carry"
  | "borrow";

export type CalculationMistakeKind =
  | "answer"
  | "carry"
  | "borrow"
  | "operand"
  | "step";

export type CalculationClassNames = {
  root?: string;
  expression?: string;
  grid?: string;
  row?: string;
  operandRow?: string;
  processRow?: string;
  answerRow?: string;
  cell?: string;
  operandCell?: string;
  resultCell?: string;
  carryCell?: string;
  borrowCell?: string;
  operator?: string;
  bar?: string;
  activeCell?: string;
  correctCell?: string;
  wrongCell?: string;
  disabledCell?: string;
  keypad?: string;
  keypadButton?: string;
  actionButton?: string;
  toolbar?: string;
  message?: string;
  checkButton?: string;
};

export type CalculationMessages = {
  chooseCell: string;
  operandsIncomplete: string;
  unsupportedNegative: string;
  correct: string;
  tryAgain: string;
  lockedWrongDigit: string;
  lockedWrongCell: string;
  assistedNextStep: string;
  keypadToggle: string;
  checkAnswer: string;
  clear: string;
  closeKeypad: string;
  openKeypad: string;
};

export type CalculationCell = {
  id: string;
  kind: CalculationCellKind;
  row: number;
  column: number;
  expected: string;
  label: string;
  message: string;
};

export type CalculationStep = {
  cellId: string;
  expected: string;
  message: string;
  kind: CalculationMistakeKind;
};

export type CalculationMistake = {
  cellId: string;
  kind: CalculationMistakeKind;
  expected: string;
  actual: string;
  message: string;
};

export type CalculationPlan = {
  operation: CalculationOperation;
  operands: number[];
  expectedAnswer: number;
  answerDigits: string[];
  answerCellIds: string[];
  processCells: CalculationCell[];
  steps: CalculationStep[];
  unsupportedReason?: string;
};

export type CalculationCheckResult = {
  isCorrect: boolean;
  answerCorrect: boolean;
  processCorrect: boolean;
  finalAnswer: number | null;
  expectedAnswer: number;
  mistakes: CalculationMistake[];
  usedHints: number;
  attempts: number;
};

export type SharedCalculationProps = {
  editableOperands?: boolean;
  guidanceMode?: GuidanceMode;
  processValidation?: ProcessValidation;
  keypadMode?: KeypadMode;
  className?: string;
  classNames?: CalculationClassNames;
  messages?: Partial<CalculationMessages>;
  onCheck?: (result: CalculationCheckResult) => void;
  onComplete?: (result: CalculationCheckResult) => void;
};
