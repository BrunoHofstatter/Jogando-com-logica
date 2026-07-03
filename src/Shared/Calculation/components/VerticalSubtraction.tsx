import type { SharedCalculationProps } from "../types";
import { VerticalCalculation } from "./VerticalCalculation";

export type VerticalSubtractionProps = SharedCalculationProps & {
  topNumber?: number;
  bottomNumber?: number;
  maxDigits?: number;
};

export function VerticalSubtraction({
  topNumber = 52,
  bottomNumber = 18,
  maxDigits = 3,
  editableOperands = false,
  ...sharedProps
}: VerticalSubtractionProps) {
  return (
    <VerticalCalculation
      operation="subtraction"
      numbers={[topNumber, bottomNumber]}
      editableOperands={editableOperands}
      maxDigits={maxDigits}
      {...sharedProps}
    />
  );
}
