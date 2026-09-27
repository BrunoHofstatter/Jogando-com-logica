import type { SharedCalculationProps } from "../types";
import { VerticalCalculation } from "./VerticalCalculation";
import { DiscoveryMultiplication } from "./DiscoveryMultiplication";

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
  if (sharedProps.guidanceMode === "adaptive" && !editableOperands) {
    return <DiscoveryMultiplication key={`${topNumber}:${bottomNumber}:${maxTopDigits}`}
      topNumber={topNumber} bottomNumber={bottomNumber} maxTopDigits={maxTopDigits} {...sharedProps} />;
  }
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
