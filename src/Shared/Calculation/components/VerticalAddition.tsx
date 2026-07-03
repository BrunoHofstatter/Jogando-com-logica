import type { SharedCalculationProps } from "../types";
import { VerticalCalculation } from "./VerticalCalculation";

export type VerticalAdditionProps = SharedCalculationProps & {
  numbers?: number[];
  maxDigits?: number;
  maxRows?: number;
};

export function VerticalAddition({
  numbers = [25, 36],
  maxDigits = 3,
  maxRows = Math.max(2, numbers.length),
  editableOperands = false,
  ...sharedProps
}: VerticalAdditionProps) {
  return (
    <VerticalCalculation
      operation="addition"
      numbers={numbers.slice(0, maxRows)}
      editableOperands={editableOperands}
      maxDigits={maxDigits}
      maxRows={maxRows}
      {...sharedProps}
    />
  );
}
