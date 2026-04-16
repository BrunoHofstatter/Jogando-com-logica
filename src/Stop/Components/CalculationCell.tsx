import { CheckCircle, XCircle } from "lucide-react";

import type { StopBox, StopBoxResult } from "../Logic/stopRound";
import styles from "../styles/StopGame.module.css";

interface CalculationCellProps {
  box: StopBox;
  value: string;
  showFeedback: boolean;
  result?: StopBoxResult;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  isTouch?: boolean;
  isLocked?: boolean;
}

/**
 * Individual calculation cell component
 * Displays a calculation prompt, current answer, and result feedback.
 */
function CalculationCell({
  box,
  value,
  showFeedback,
  result,
  inputRef,
  onChange,
  onFocus,
  isTouch,
  isLocked,
}: CalculationCellProps) {
  const showCorrectIcon = result?.status === "correct";
  const showWrongIcon =
    result !== undefined &&
    showFeedback &&
    (result.status === "wrong" || result.status === "blank");

  return (
    <div>
      <div className={box.kind === "dual" ? styles.headerDual : styles.header}>
        {box.kind === "dual" ? (
          <>
            <div>
              {box.operations[0]}
              {box.operands[0]}
            </div>
            <div>
              {box.operations[1]}
              {box.operands[1]}
            </div>
          </>
        ) : (
          <>
            {box.operation}
            {box.operand}
          </>
        )}
      </div>

      <form
        className={styles.cellBorder}
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          ref={inputRef}
          className={styles.inputCell}
          type={isTouch ? "text" : "number"}
          inputMode={isTouch ? "none" : "numeric"}
          readOnly={Boolean(isTouch) || Boolean(isLocked)}
          disabled={Boolean(isLocked)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          autoComplete="off"
        />
      </form>

      {showFeedback && result && (
        <div className={styles.feedback}>
          {showCorrectIcon && (
            <div className={styles.iconStack}>
              <CheckCircle
                className={`${styles.icon} ${styles.check} out`}
                strokeWidth={4}
                color="black"
              />
              <CheckCircle
                className={`${styles.icon} ${styles.check}`}
                strokeWidth={1.5}
                color="#0fb11d"
              />
            </div>
          )}

          {showWrongIcon && (
            <>
              <div className={styles.iconStack}>
                <XCircle
                  className={`${styles.icon} ${styles.xmark} out`}
                  strokeWidth={4}
                  color="black"
                />
                <XCircle
                  className={`${styles.icon} ${styles.xmark}`}
                  strokeWidth={1.5}
                  color="#f02121"
                />
              </div>
              <div className={styles.correction}>{result.correctAnswer}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CalculationCell;
