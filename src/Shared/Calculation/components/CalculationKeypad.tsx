import clsx from "clsx";
import type { CalculationClassNames, CalculationMessages } from "../types";
import styles from "../Calculation.module.css";

type CalculationKeypadProps = {
  classNames?: CalculationClassNames;
  messages: CalculationMessages;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClose?: () => void;
};

export function CalculationKeypad({
  classNames,
  messages,
  onDigit,
  onBackspace,
  onClose,
}: CalculationKeypadProps) {
  return (
    <div className={clsx(styles.keypad, classNames?.keypad)} aria-label="Teclado numérico">
      {"1234567890".split("").map((digit) => (
        <button
          key={digit}
          className={clsx(styles.keypadButton, classNames?.keypadButton)}
          type="button"
          onClick={() => onDigit(digit)}
        >
          {digit}
        </button>
      ))}
      <button
        className={clsx(styles.keypadButton, classNames?.keypadButton)}
        type="button"
        onClick={onBackspace}
      >
        apagar
      </button>
      {onClose ? (
        <button
          className={clsx(styles.keypadButton, classNames?.keypadButton)}
          type="button"
          onClick={onClose}
        >
          {messages.closeKeypad}
        </button>
      ) : null}
    </div>
  );
}
