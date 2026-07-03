export function operandCellId(row: number, column: number) {
  return `operand-${row}-${column}`;
}

export function answerCellId(column: number) {
  return `answer-${column}`;
}

export function carryCellId(column: number) {
  return `carry-${column}`;
}

export function borrowCellId(column: number) {
  return `borrow-${column}`;
}
