import clsx from "clsx";
import type { CalculationCellKind, CalculationClassNames } from "../types";
import styles from "../Calculation.module.css";

type CalculationCellProps = {
  id: string;
  value: string;
  kind: CalculationCellKind;
  active?: boolean;
  disabled?: boolean;
  shaking?: boolean;
  label: string;
  classNames?: CalculationClassNames;
  onSelect: (id: string) => void;
};

export function CalculationCell({
  id,
  value,
  kind,
  active = false,
  disabled = false,
  shaking = false,
  label,
  classNames,
  onSelect,
}: CalculationCellProps) {
  const kindClass = {
    operand: classNames?.operandCell,
    answer: classNames?.resultCell,
    carry: classNames?.carryCell,
    borrow: classNames?.borrowCell,
  }[kind];

  return (
    <button
      className={clsx(
        styles.cell,
        styles[kind],
        classNames?.cell,
        kindClass,
        active && [styles.activeCell, classNames?.activeCell],
        disabled && [styles.disabledCell, classNames?.disabledCell],
        shaking && styles.shakingCell,
      )}
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={() => onSelect(id)}
    >
      {value}
    </button>
  );
}
