import { buildMultiplicationPlan } from './multiplication';
import { checkCalculationPlan } from './validation';
import type { ProcessValidation } from '../types';

export function multiplicationColumns(top: number, bottom: number, digits: number) {
  const topDigits = String(top).padStart(digits, ' ');
  let carry = 0;
  return Array.from({ length: String(top).length }, (_, offset) => {
    const column = digits - offset;
    const digit = Number(topDigits[column - 1]);
    const incoming = carry;
    const product = digit * bottom;
    const total = product + incoming;
    carry = Math.floor(total / 10);
    return { column, digit, multiplier: bottom, incoming, product, total,
      units: String(total % 10), leading: carry ? String(carry) : '',
      destination: offset + 1 < String(top).length ? `carry-${column - 1}` : `answer-${column - 1}`,
      answer: `answer-${column}`, operand: `operand-${column}` };
  });
}
export type MultiplicationColumn = ReturnType<typeof multiplicationColumns>[number];
export interface DiscoveryState {
  values: Record<string, string>;
  active: string | null;
  support: { column: number; level: number } | null;
  revealed: Record<number, number>;
  inspected: Record<string, string>;
  wrong: string[];
  offered: boolean;
  revision: number;
  hints: number;
  mistakes: number;
  attempts: number;
  complete: boolean;
}
export const initialDiscoveryState: DiscoveryState = {
  values: {}, active: null, support: null, revealed: {}, inspected: {}, wrong: [],
  offered: false, revision: 0, hints: 0, mistakes: 0, attempts: 0, complete: false,
};
export type DiscoveryAction = { type: 'select'; cell: string }
  | { type: 'enter'; value: string }
  | { type: 'inspect' | 'help' | 'idle' | 'check' | 'clear' | 'dismiss' | 'previousHint' };

export function createDiscoveryModel(top: number, bottom: number, digits: number, processValidation: ProcessValidation = 'warn') {
  const plan = buildMultiplicationPlan(top, bottom, digits);
  const columns = multiplicationColumns(top, bottom, digits);
  const expected: Record<string, string> = Object.fromEntries(plan.answerCellIds.map((id, i) => [id, plan.answerDigits[i].trim()]));
  for (let column = 1; column < digits; column++) expected[`carry-${column}`] = '';
  plan.processCells.forEach(cell => { expected[cell.id] = cell.expected; });
  const incorrect = (values: DiscoveryState['values']) => Object.keys(values).filter(id =>
    !(processValidation === 'ignore' && id.startsWith('carry-')) &&
    values[id] !== '' && values[id] !== expected[id] && !(expected[id] === '' && values[id] === '0'));
  const solved = (column: MultiplicationColumn, values: DiscoveryState['values']) =>
    values[column.answer] === column.units && (!column.leading || values[column.destination] === column.leading);
  const targetFor = (state: DiscoveryState) => {
    const wrong = incorrect(state.values);
    const columnForCell = (id: string) => columns.find(col => col.answer === id || col.destination === id);
    return (wrong[0] ? columnForCell(wrong[0]) : null)
      ?? columns.find(col => !solved(col, state.values)) ?? columns[0];
  };
  const reveal = (state: DiscoveryState, column: number, level: number): DiscoveryState => {
    const previous = state.revealed[column] ?? 0;
    const next = Math.min(3, level);
    return { ...state, support: { column, level: next }, offered: false,
      revealed: { ...state.revealed, [column]: Math.max(previous, next) }, hints: state.hints + Math.max(0, next - previous) };
  };
  const result = (state: DiscoveryState) => {
    const checked = checkCalculationPlan(plan, { answerValues: state.values, processValues: state.values,
      processValidation, usedHints: state.hints, attempts: state.attempts + 1 });
    // Blank carries are optional in independent work; an explicitly wrong digit is not.
    return { ...checked, isCorrect: checked.isCorrect && incorrect(state.values).length === 0 };
  };
  const reducer = (state: DiscoveryState, action: DiscoveryAction): DiscoveryState => {
    if (state.complete) return state;
    if (action.type === 'select') return { ...state, active: action.cell, offered: false, revision: state.revision + 1 };
    if (action.type === 'clear') return { ...initialDiscoveryState, hints: state.hints, mistakes: state.mistakes,
      attempts: state.attempts, revealed: state.revealed, revision: state.revision + 1 };
    if (action.type === 'dismiss') return { ...state, support: null, offered: false, revision: state.revision + 1 };
    if (action.type === 'previousHint') return !state.support || state.support.level <= 1 ? state
      : { ...state, support: { ...state.support, level: state.support.level - 1 }, revision: state.revision + 1 };
    if (action.type === 'enter') {
      if (!state.active || !(state.active in expected)) return state;
      const values = { ...state.values, [state.active]: action.value };
      const inspected = { ...state.inspected };
      delete inspected[state.active];
      const helped = columns.find(col => col.column === state.support?.column);
      return { ...state, values, inspected, wrong: state.wrong.filter(id => id !== state.active),
        support: helped && solved(helped, values) ? null : state.support,
        offered: false, revision: state.revision + 1 };
    }
    if (action.type === 'inspect') {
      const wrong = incorrect(state.values);
      const fresh = wrong.filter(id => state.inspected[id] !== state.values[id]);
      if (!fresh.length) return state;
      const next = { ...state, wrong, mistakes: state.mistakes + fresh.length,
        inspected: { ...state.inspected, ...Object.fromEntries(fresh.map(id => [id, state.values[id]])) } };
      const target = targetFor(next);
      return reveal(next, target.column, state.support?.column === target.column ? state.support.level + 1 : 1);
    }
    if (action.type === 'check') {
      if (result(state).isCorrect) return { ...state, complete: true, support: null, wrong: [], attempts: state.attempts + 1 };
      const wrong = incorrect(state.values);
      const next = { ...state, wrong, attempts: state.attempts + 1, mistakes: state.mistakes + 1,
        inspected: { ...state.inspected, ...Object.fromEntries(wrong.map(id => [id, state.values[id]])) } };
      const target = targetFor(next);
      return reveal(next, target.column, state.support?.column === target.column ? state.support.level + 1 : 1);
    }
    if (action.type === 'idle' && !state.offered && !state.support) return { ...state, offered: true };
    const target = state.support ? columns.find(col => col.column === state.support!.column)! : targetFor(state);
    return reveal(state, target.column, (state.support?.level ?? 0) + 1);
  };
  return { plan, columns, expected, reducer, result };
}
