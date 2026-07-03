import type { SharedCalculationProps } from "../types";
import { VerticalCalculation } from "./VerticalCalculation";

export type VerticalMultiplicationProps = SharedCalculationProps & {
  topNumber?: number;
  bottomNumber?: number;
  maxTopDigits?: number;
};

export function VerticalMultiplication({
  topNumber = 16,
  bottomNumber = 6,
  maxTopDigits = 3,
  editableOperands = false,
  ...sharedProps
}: VerticalMultiplicationProps) {
  return (
    <VerticalCalculation
      operation="multiplication"
      numbers={[topNumber, bottomNumber]}
      editableOperands={editableOperands}
      maxDigits={maxTopDigits}
      {...sharedProps}
    />
  );
}
