import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { defaultCalculationMessages } from "../defaultMessages";
import { buildAdditionPlan } from "../logic/addition";
import { answerCellId, borrowCellId, carryCellId, operandCellId } from "../logic/cellIds";
import { buildMultiplicationPlan } from "../logic/multiplication";
import { normalizeDigitText } from "../logic/numberFormat";
import { buildSubtractionPlan } from "../logic/subtraction";
import { checkCalculationPlan } from "../logic/validation";
import type {
  AdaptiveGuidanceOptions,
  CalculationCell as CalculationCellData,
  CalculationCheckResult,
  CalculationClassNames,
  CalculationMessages,
  CalculationOperation,
  CalculationPlan,
  GuidanceMode,
  KeypadMode,
  ProcessValidation,
} from "../types";
import styles from "../Calculation.module.css";
import { CalculationCell } from "./CalculationCell";
import { CalculationKeypad } from "./CalculationKeypad";

type VerticalCalculationProps = {
  operation: CalculationOperation;
  numbers: number[];
  editableOperands?: boolean;
  maxDigits: number;
  maxRows?: number;
  guidanceMode?: GuidanceMode;
  processValidation?: ProcessValidation;
  keypadMode?: KeypadMode;
  className?: string;
  classNames?: CalculationClassNames;
  messages?: Partial<CalculationMessages>;
  adaptiveGuidance?: AdaptiveGuidanceOptions;
  showClearButton?: boolean;
  onCheck?: (result: CalculationCheckResult) => void;
  onComplete?: (result: CalculationCheckResult) => void;
  onMistake?: () => void;
};

const operatorByOperation = {
  addition: "+",
  subtraction: "-",
  multiplication: "x",
};

function isTouchPreferred() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(pointer: coarse)").matches;
}

function getInitialOperandRows(
  operation: CalculationOperation,
  numbers: number[],
  editableOperands: boolean,
  maxDigits: number,
  maxRows?: number,
) {
  if (!editableOperands) {
    return numbers.map((value) => Math.max(0, Math.floor(value)).toString());
  }

  if (numbers.length > 0) {
    return numbers.map((value) => Math.max(0, Math.floor(value)).toString());
  }

  const rowCount = operation === "addition" ? Math.max(2, maxRows ?? 2) : 2;
  return Array.from({ length: rowCount }, () => "");
}

function getOperandColumnValue(value: string, column: number, maxDigits: number) {
  if (column < 0 || column >= maxDigits) {
    return "";
  }

  return (value.padStart(maxDigits, " ").slice(-maxDigits)[column] ?? "").trim();
}

function setOperandColumnValue(value: string, column: number, maxDigits: number, digit: string) {
  if (column < 0 || column >= maxDigits) {
    return value;
  }

  const digits = value.padStart(maxDigits, " ").slice(-maxDigits).split("");
  digits[column] = digit || " ";
  return digits.join("").replace(/\s/g, "").replace(/^0+(?=\d)/, "").slice(0, maxDigits);
}

function parseOperandRows(rows: string[]) {
  if (rows.some((row) => row.trim() === "")) {
    return null;
  }

  return rows.map((row) => Number(row));
}

function buildPlan(
  operation: CalculationOperation,
  operands: number[],
  maxDigits: number,
): CalculationPlan | null {
  if (operation === "addition") {
    return buildAdditionPlan(operands, maxDigits);
  }

  if (operands.length < 2) {
    return null;
  }

  if (operation === "subtraction") {
    return buildSubtractionPlan(operands[0], operands[1], maxDigits);
  }

  return buildMultiplicationPlan(operands[0], operands[1], maxDigits);
}

function getProcessCellMap(plan: CalculationPlan | null) {
  const map = new Map<string, CalculationCellData>();

  plan?.processCells.forEach((cell) => {
    map.set(cell.id, cell);
  });

  return map;
}

export function VerticalCalculation({
  operation,
  numbers,
  editableOperands = false,
  maxDigits,
  maxRows,
  guidanceMode = "free",
  processValidation = "ignore",
  keypadMode = "auto",
  className,
  classNames,
  messages: customMessages,
  adaptiveGuidance,
  showClearButton = true,
  onCheck,
  onComplete,
  onMistake,
}: VerticalCalculationProps) {
  const messages = { ...defaultCalculationMessages, ...customMessages };
  const [operandRows, setOperandRows] = useState(() =>
    getInitialOperandRows(operation, numbers, editableOperands, maxDigits, maxRows),
  );
  const [answerValues, setAnswerValues] = useState<Record<string, string>>({});
  const [processValues, setProcessValues] = useState<Record<string, string>>({});
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const [message, setMessage] = useState(messages.chooseCell);
  const [shakingCellId, setShakingCellId] = useState<string | null>(null);
  const [usedHints, setUsedHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [, setStepMistakes] = useState(0);
  const [keypadOpen, setKeypadOpen] = useState(() => {
    if (keypadMode === "visible") {
      return true;
    }

    if (keypadMode === "hidden" || keypadMode === "toggle") {
      return false;
    }

    return isTouchPreferred();
  });

  const numbersKey = numbers.join("|");
  const stableNumbers = useMemo(
    () => (numbersKey ? numbersKey.split("|").map((value) => Number(value)) : []),
    [numbersKey],
  );
  const operands = useMemo(() => parseOperandRows(operandRows), [operandRows]);
  const plan = useMemo(
    () => (operands ? buildPlan(operation, operands, maxDigits) : null),
    [maxDigits, operands, operation],
  );
  const processCellMap = useMemo(() => getProcessCellMap(plan), [plan]);
  const answerLength = operation === "subtraction" ? maxDigits : maxDigits + 1;
  const gridColumns = answerLength + 1;
  const operandColumnOffset = answerLength - maxDigits;
  const nextPendingStep = useMemo(
    () =>
      plan?.steps.find((step) => {
        const value = step.kind === "answer"
          ? answerValues[step.cellId]
          : processValues[step.cellId];
        return (value ?? "").trim() !== step.expected;
      }) ?? null,
    [answerValues, plan, processValues],
  );
  const isAdaptive = guidanceMode === "adaptive";
  const autoHintDelayMs = adaptiveGuidance?.autoHintDelayMs ?? 15000;
  const detailedHintDelayMs = adaptiveGuidance?.detailedHintDelayMs ?? 30000;
  const mistakesBeforeHint = adaptiveGuidance?.mistakesBeforeHint ?? 1;
  const mistakesBeforeDetailedHint = adaptiveGuidance?.mistakesBeforeDetailedHint ?? 3;

  useEffect(() => {
    setOperandRows(getInitialOperandRows(operation, stableNumbers, editableOperands, maxDigits, maxRows));
    setAnswerValues({});
    setProcessValues({});
  }, [editableOperands, maxDigits, maxRows, operation, stableNumbers]);

  useEffect(() => {
    if (activeCellId) {
      return;
    }

    if (editableOperands) {
      setActiveCellId(operandCellId(0, operandColumnOffset));
      return;
    }

    setActiveCellId(nextPendingStep?.cellId ?? answerCellId(answerLength - 1));
  }, [activeCellId, nextPendingStep?.cellId, answerLength, editableOperands, operandColumnOffset]);

  useEffect(() => {
    if ((guidanceMode === "locked" || isAdaptive) && nextPendingStep) {
      setActiveCellId(nextPendingStep.cellId);
    }
  }, [nextPendingStep, guidanceMode, isAdaptive]);

  useEffect(() => {
    if (!isAdaptive || !nextPendingStep) {
      return;
    }

    setHintLevel(0);
    setStepMistakes(0);
    setMessage(messages.chooseCell);

    const hintTimer = window.setTimeout(() => {
      setHintLevel(1);
      setMessage(nextPendingStep.guidance?.prompt ?? nextPendingStep.message);
      setUsedHints((current) => current + 1);
    }, autoHintDelayMs);

    const detailTimer = window.setTimeout(() => {
      setHintLevel(2);
      setMessage(nextPendingStep.guidance?.detail ?? nextPendingStep.message);
      setUsedHints((current) => current + 1);
    }, detailedHintDelayMs);

    return () => {
      window.clearTimeout(hintTimer);
      window.clearTimeout(detailTimer);
    };
  }, [
    autoHintDelayMs,
    detailedHintDelayMs,
    isAdaptive,
    messages.chooseCell,
    nextPendingStep,
  ]);

  const showKeypadToggle = keypadMode === "toggle" || (keypadMode === "auto" && !isTouchPreferred());
  const showKeypad = keypadMode !== "hidden" && keypadOpen;

  const clearCalculation = () => {
    setAnswerValues({});
    setProcessValues({});
    setMessage(messages.chooseCell);
    setActiveCellId(editableOperands ? operandCellId(0, operandColumnOffset) : answerCellId(answerLength - 1));
    setHintLevel(0);
    setStepMistakes(0);
  };

  const showAdaptiveHint = (level: 1 | 2) => {
    if (!nextPendingStep) {
      return;
    }

    const effectiveLevel = Math.max(hintLevel, level) as 1 | 2;
    setHintLevel(effectiveLevel);
    setMessage(
      effectiveLevel === 2
        ? nextPendingStep.guidance?.detail ?? nextPendingStep.message
        : nextPendingStep.guidance?.prompt ?? nextPendingStep.message,
    );
  };

  const registerAdaptiveMistake = () => {
    onMistake?.();
    setUsedHints((current) => current + 1);
    setStepMistakes((current) => {
      const next = current + 1;

      if (next >= mistakesBeforeDetailedHint) {
        showAdaptiveHint(2);
      } else if (next >= mistakesBeforeHint) {
        showAdaptiveHint(1);
      }

      return next;
    });
  };

  const requestAdaptiveHelp = () => {
    if (!nextPendingStep) {
      return;
    }

    setUsedHints((current) => current + 1);
    showAdaptiveHint(hintLevel >= 1 ? 2 : 1);
    setActiveCellId(nextPendingStep.cellId);
  };

  const getCellValue = (cellId: string) => {
    if (cellId.startsWith("operand-")) {
      const [, rowText, columnText] = cellId.split("-");
      const row = Number(rowText);
      const column = Number(columnText) - operandColumnOffset;
      return getOperandColumnValue(operandRows[row] ?? "", column, maxDigits);
    }

    if (cellId.startsWith("answer-")) {
      return answerValues[cellId] ?? "";
    }

    return processValues[cellId] ?? "";
  };

  const setCellValue = (cellId: string, rawValue: string) => {
    const value = normalizeDigitText(rawValue).slice(0, 2);

    if (cellId.startsWith("operand-")) {
      if (!editableOperands) {
        return;
      }

      const [, rowText, columnText] = cellId.split("-");
      const row = Number(rowText);
      const displayColumn = Number(columnText);
      const operandColumn = displayColumn - operandColumnOffset;
      const digit = value.slice(-1);

      setOperandRows((currentRows) =>
        currentRows.map((currentValue, index) =>
          index === row
            ? setOperandColumnValue(currentValue, operandColumn, maxDigits, digit)
            : currentValue,
        ),
      );
      setAnswerValues({});
      setProcessValues({});
      return;
    }

    if (cellId.startsWith("answer-")) {
      setAnswerValues((currentValues) => ({ ...currentValues, [cellId]: value.slice(-1) }));
      return;
    }

    setProcessValues((currentValues) => ({ ...currentValues, [cellId]: value }));
  };

  const selectCell = (cellId: string) => {
    if (isAdaptive && nextPendingStep && cellId !== nextPendingStep.cellId) {
      const selectedStep = plan?.steps.find((step) => step.cellId === cellId);
      const selectedValue = getCellValue(cellId);

      if (selectedStep && selectedValue.trim() === selectedStep.expected) {
        setActiveCellId(cellId);
        setMessage(messages.chooseCell);
        setHintLevel(0);
        return;
      }

      setMessage(messages.assistedNextStep);
      registerAdaptiveMistake();
      setShakingCellId(cellId);
      setActiveCellId(nextPendingStep.cellId);
      window.setTimeout(() => setShakingCellId(null), 280);
      return;
    }

    if (guidanceMode === "locked" && nextPendingStep && cellId !== nextPendingStep.cellId) {
      setMessage(messages.lockedWrongCell);
      setUsedHints((current) => current + 1);
      setShakingCellId(cellId);
      window.setTimeout(() => setShakingCellId(null), 280);
      return;
    }

    if (guidanceMode === "assisted" && nextPendingStep && cellId !== nextPendingStep.cellId) {
      setMessage(messages.assistedNextStep);
      setUsedHints((current) => current + 1);
    }

    setActiveCellId(cellId);
  };

  const moveToNextLooseCell = (currentCellId: string) => {
    const answerIds = Array.from({ length: answerLength }, (_, column) => answerCellId(column));
    const currentIndex = answerIds.indexOf(currentCellId);

    if (currentIndex > 0) {
      setActiveCellId(answerIds[currentIndex - 1]);
    }
  };

  const enterDigit = (digit: string) => {
    if (!activeCellId) {
      setMessage(messages.chooseCell);
      return;
    }

    if (!plan && !activeCellId.startsWith("operand-")) {
      setMessage(messages.operandsIncomplete);
      return;
    }

    if (plan?.unsupportedReason === "negative") {
      setMessage(messages.unsupportedNegative);
      return;
    }

    const activeStep = plan?.steps.find((step) => step.cellId === activeCellId);
    const editingCompletedStep = Boolean(
      isAdaptive &&
      activeStep &&
      activeCellId !== nextPendingStep?.cellId &&
      getCellValue(activeCellId).trim() === activeStep.expected,
    );

    if (editingCompletedStep && activeStep) {
      if (digit === activeStep.expected) {
        setCellValue(activeCellId, digit);
        return;
      }

      setCellValue(activeCellId, digit);
      setMessage(messages.lockedWrongDigit);
      registerAdaptiveMistake();
      setShakingCellId(activeCellId);
      window.setTimeout(() => setShakingCellId(null), 280);
      return;
    }

    if ((guidanceMode === "locked" || isAdaptive) && nextPendingStep && activeCellId !== nextPendingStep.cellId) {
      setMessage(messages.lockedWrongCell);
      if (isAdaptive) {
        registerAdaptiveMistake();
        setActiveCellId(nextPendingStep.cellId);
      }
      return;
    }

    if ((guidanceMode === "locked" || isAdaptive) && nextPendingStep && digit !== nextPendingStep.expected) {
      setCellValue(activeCellId, "");
      if (isAdaptive) {
        setMessage(messages.lockedWrongDigit);
        registerAdaptiveMistake();
      } else {
        setMessage(nextPendingStep.message || messages.lockedWrongDigit);
        setUsedHints((current) => current + 1);
      }
      setShakingCellId(activeCellId);
      window.setTimeout(() => setShakingCellId(null), 280);
      return;
    }

    setCellValue(activeCellId, digit);

    if ((guidanceMode === "locked" || isAdaptive) && nextPendingStep) {
      setMessage(isAdaptive ? messages.chooseCell : nextPendingStep.message);
      const nextStep = plan?.steps.find((step) => {
        if (step.cellId === nextPendingStep.cellId) {
          return false;
        }

        const currentValue = step.kind === "answer"
          ? answerValues[step.cellId]
          : processValues[step.cellId];
        return (currentValue ?? "").trim() !== step.expected;
      });
      setActiveCellId(nextStep?.cellId ?? activeCellId);
      return;
    }

    if (guidanceMode !== "locked" && !isAdaptive) {
      moveToNextLooseCell(activeCellId);
    }
  };

  const clearActiveCell = () => {
    if (!activeCellId) {
      return;
    }

    setCellValue(activeCellId, "");
  };

  const checkAnswer = () => {
    if (!plan) {
      setMessage(messages.operandsIncomplete);
      return;
    }

    if (plan.unsupportedReason === "negative") {
      setMessage(messages.unsupportedNegative);
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const result = checkCalculationPlan(plan, {
      answerValues,
      processValues,
      processValidation,
      usedHints,
      attempts: nextAttempts,
    });

    setMessage(result.isCorrect ? messages.correct : messages.tryAgain);
    onCheck?.(result);

    if (isAdaptive && !result.isCorrect) {
      registerAdaptiveMistake();
    }

    if (result.isCorrect) {
      onComplete?.(result);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        enterDigit(event.key);
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        clearActiveCell();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  const renderEmptyDisplayCell = (key: string) => (
    <span key={key} className={styles.emptyCell} aria-hidden="true" />
  );

  const renderAdaptiveCoach = (cellId: string) => {
    if (!isAdaptive || hintLevel === 0 || nextPendingStep?.cellId !== cellId) {
      return null;
    }

    return (
      <div className={clsx(styles.coach, classNames?.coach)} aria-live="polite">
        <span className={clsx(styles.coachArrow, classNames?.coachArrow)} aria-hidden="true" />
        <span className={clsx(styles.coachBadge, classNames?.coachBadge)}>{messages.hint}</span>
        {hintLevel === 2 && nextPendingStep.guidance?.equationPrefix ? (
          <div
            className={clsx(styles.coachEquation, classNames?.coachEquation)}
            aria-label={`${nextPendingStep.guidance.equationPrefix} ${nextPendingStep.guidance.leadingDigit ?? ""}${nextPendingStep.guidance.resultDigit ?? ""}`}
          >
            <span>{nextPendingStep.guidance.equationPrefix}</span>
            {nextPendingStep.guidance.leadingDigit ? (
              <span
                className={clsx(
                  styles.coachLeadingDigit,
                  nextPendingStep.guidance.leadingDestination === "carry" && styles.coachCarryDigit,
                  classNames?.coachLeadingDigit,
                )}
              >
                {nextPendingStep.guidance.leadingDigit}
              </span>
            ) : null}
            {nextPendingStep.guidance.resultDigit ? (
              <span className={clsx(styles.coachResultDigit, classNames?.coachResultDigit)}>
                {nextPendingStep.guidance.resultDigit}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className={clsx(styles.coachText, classNames?.coachText)}>{message}</p>
      </div>
    );
  };

  const renderOperandCell = (row: number, column: number) => {
    const cellId = operandCellId(row, column);
    const operandColumn = column - operandColumnOffset;

    if (operandColumn < 0 || operandColumn >= maxDigits) {
      return renderEmptyDisplayCell(cellId);
    }

    const value = getOperandColumnValue(operandRows[row] ?? "", operandColumn, maxDigits);
    const disabled = !editableOperands;

    return (
      <CalculationCell
        key={cellId}
        id={cellId}
        kind="operand"
        value={value}
        active={activeCellId === cellId}
        disabled={disabled}
        shaking={shakingCellId === cellId}
        label="Número da conta"
        classNames={classNames}
        onSelect={selectCell}
      />
    );
  };

  const renderProcessCell = (column: number) => {
    const carryCell = processCellMap.get(carryCellId(column));
    const borrowCell = processCellMap.get(borrowCellId(column));
    const cell = carryCell ?? borrowCell;

    if (!cell) {
      return renderEmptyDisplayCell(`process-${column}`);
    }

    return (
      <CalculationCell
        key={cell.id}
        id={cell.id}
        kind={cell.kind}
        value={getCellValue(cell.id)}
        active={activeCellId === cell.id}
        shaking={shakingCellId === cell.id}
        label={cell.label}
        coach={renderAdaptiveCoach(cell.id)}
        coachPlacement="right"
        classNames={classNames}
        onSelect={selectCell}
      />
    );
  };

  const renderAnswerCell = (column: number) => {
    const cellId = answerCellId(column);

    return (
      <CalculationCell
        key={cellId}
        id={cellId}
        kind="answer"
        value={answerValues[cellId] ?? ""}
        active={activeCellId === cellId}
        shaking={shakingCellId === cellId}
        label="Resultado"
        coach={renderAdaptiveCoach(cellId)}
        coachPlacement="below"
        classNames={classNames}
        onSelect={selectCell}
      />
    );
  };

  const operandRowsForDisplay =
    operation === "addition" && editableOperands && maxRows
      ? operandRows.slice(0, maxRows)
      : operandRows;
  const operatorRowIndex = operandRowsForDisplay.length - 1;

  return (
    <section className={clsx(styles.root, className, classNames?.root)}>
      <div className={clsx(styles.workspace, classNames?.workspace)}>
        <div className={clsx(styles.calculationStage, classNames?.calculationStage)}>
          <div
            className={clsx(styles.grid, classNames?.grid)}
            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: gridColumns }, (_, column) =>
              column === 0 ? renderEmptyDisplayCell(`process-op-${column}`) : renderProcessCell(column - 1),
            )}

            {operandRowsForDisplay.map((_, row) => (
              <div key={`operand-row-${row}`} className={clsx(styles.row, classNames?.row, classNames?.operandRow)}>
                {Array.from({ length: gridColumns }, (_, column) => {
                  if (column === 0) {
                    return (
                      <span key={`operator-${row}`} className={clsx(styles.operator, classNames?.operator)}>
                        {row === operatorRowIndex ? operatorByOperation[operation] : ""}
                      </span>
                    );
                  }

                  return renderOperandCell(row, column - 1);
                })}
              </div>
            ))}

            <div className={clsx(styles.bar, classNames?.bar)} style={{ gridColumn: `1 / span ${gridColumns}` }} />

            <div className={clsx(styles.row, classNames?.row, classNames?.answerRow)}>
              {Array.from({ length: gridColumns }, (_, column) =>
                column === 0 ? renderEmptyDisplayCell("answer-operator") : renderAnswerCell(column - 1),
              )}
            </div>
          </div>
        </div>

        <div className={clsx(styles.controlRail, classNames?.controlRail)}>
          <div className={clsx(styles.toolbar, classNames?.toolbar)}>
            {isAdaptive && nextPendingStep ? (
              <button
                className={clsx(styles.actionButton, styles.helpButton, classNames?.actionButton, classNames?.helpButton)}
                type="button"
                onClick={requestAdaptiveHelp}
              >
                {messages.help}
              </button>
            ) : null}
            {showKeypadToggle ? (
              <button
                className={clsx(styles.actionButton, classNames?.actionButton)}
                type="button"
                onClick={() => setKeypadOpen((current) => !current)}
              >
                {keypadOpen ? messages.closeKeypad : messages.openKeypad}
              </button>
            ) : null}
            {showClearButton ? (
              <button
                className={clsx(styles.actionButton, classNames?.actionButton)}
                type="button"
                onClick={clearCalculation}
              >
                {messages.clear}
              </button>
            ) : null}
            <button
              className={clsx(styles.actionButton, classNames?.actionButton, classNames?.checkButton)}
              type="button"
              onClick={checkAnswer}
            >
              {messages.checkAnswer}
            </button>
          </div>

          {showKeypad ? (
            <CalculationKeypad
              classNames={classNames}
              messages={messages}
              onDigit={enterDigit}
              onBackspace={clearActiveCell}
              onClose={showKeypadToggle ? () => setKeypadOpen(false) : undefined}
            />
          ) : null}
        </div>
      </div>

      {!isAdaptive ? (
        <p className={clsx(styles.message, classNames?.message)} aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}
