import { describe, expect, it } from 'vitest';
import { createDiscoveryModel, initialDiscoveryState, multiplicationColumns } from './discoveryMultiplication';

describe('multiplication visual relationships', () => {
  it('routes the last leading digit to the answer, even with padded operands', () => {
    expect(multiplicationColumns(25, 6, 3)).toEqual([
      expect.objectContaining({ column: 3, product: 30, incoming: 0, units: '0', leading: '3', destination: 'carry-2' }),
      expect.objectContaining({ column: 2, product: 12, incoming: 3, total: 15, units: '5', leading: '1', destination: 'answer-1' }),
    ]);
  });
  it('keeps optional carries distinct from required process validation', () => {
    const values = { 'answer-0': '1', 'answer-1': '5', 'answer-2': '0' };
    const state = { ...initialDiscoveryState, values };
    expect(createDiscoveryModel(25, 6, 2, 'warn').result(state).isCorrect).toBe(true);
    expect(createDiscoveryModel(25, 6, 2, 'require').result(state).isCorrect).toBe(false);
    expect(createDiscoveryModel(25, 6, 2, 'require').result({ ...state, values: { ...values, 'carry-1': '3' } }).isCorrect).toBe(true);
  });
  it('keeps blank carry cells neutral and does not count selecting a future cell as an error', () => {
    const model = createDiscoveryModel(12, 2, 2);
    let state = model.reducer(initialDiscoveryState, { type: 'select', cell: 'carry-1' });
    state = model.reducer(state, { type: 'enter', value: '0' });
    state = model.reducer(state, { type: 'inspect' });
    expect(state.mistakes).toBe(0); expect(state.support).toBeNull();
  });
});
