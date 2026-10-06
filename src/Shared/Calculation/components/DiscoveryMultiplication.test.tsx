// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VerticalMultiplication } from './VerticalMultiplication';

let container: HTMLDivElement;
let root: Root;
let visible: boolean;
const complete = vi.fn(), mistake = vi.fn();
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  visible = true;
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visible ? 'visible' : 'hidden');
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  complete.mockClear(); mistake.mockClear();
  container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount()); container.remove();
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
function render(top = 25, bottom = 6, readOnly = false, keypadMode: 'hidden' | 'visible' = 'hidden') {
  act(() => root.render(<div><button data-outside>Fora</button><VerticalMultiplication topNumber={top} bottomNumber={bottom}
    maxTopDigits={2} guidanceMode="adaptive" keypadMode={keypadMode} readOnly={readOnly}
    onComplete={complete} onMistake={mistake} adaptiveGuidance={{ autoHintDelayMs: 25000 }} /></div>));
}
const cell = (id: string) => container.querySelector<HTMLButtonElement>(`[data-cell="${id}"]`)!;
const click = (element: HTMLElement) => act(() => element.click());
const button = (text: string) => [...container.querySelectorAll('button')].find(el => el.textContent?.trim() === text)!;
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
function key(target: HTMLElement, value: string) {
  const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
  act(() => target.dispatchEvent(event)); return event;
}
function write(id: string, value: string) { click(cell(id)); key(cell(id), value); }
function hide(hidden: boolean) { visible = !hidden; act(() => document.dispatchEvent(new Event('visibilitychange'))); }

describe('free multiplication with progressive visual help', () => {
  it.each([[16, 4, '64'], [25, 6, '150'], [36, 6, '216']])('accepts %i × %i in any order without hints or required carries', (top, bottom, answer) => {
    render(top, bottom);
    expect(container.querySelector('[data-selected]')).toBeNull();
    expect(container.querySelector('[data-anchor="hint-digit"]')).toBeNull();
    // Deliberately work from the left, without following the written algorithm.
    answer.padStart(3, ' ').split('').forEach((digit, index) => { if (digit.trim()) write(`answer-${index}`, digit); });
    click(button('Verificar'));
    expect(complete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ finalAnswer: Number(answer), usedHints: 0, isCorrect: true }));
    expect(mistake).not.toHaveBeenCalled();
    key(cell('answer-2'), '9'); click(button('Verificar'));
    expect(cell('answer-2').textContent).toBe(answer[answer.length - 1]);
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it('clearly selects either result or carry without selecting a prescribed next cell', () => {
    render();
    write('carry-1', '3');
    expect(cell('carry-1').dataset.selected).toBe('true');
    expect(cell('carry-1').getAttribute('aria-label')).toContain('dezenas: 3');
    write('answer-1', '5');
    expect(cell('answer-1').getAttribute('aria-pressed')).toBe('true');
    expect(cell('carry-1').hasAttribute('data-selected')).toBe(false);
    expect(mistake).not.toHaveBeenCalled();
  });
  it('keeps wrong input editable and lets a quick correction pass silently', () => {
    render(); write('answer-2', '7'); advance(600); key(cell('answer-2'), '0'); advance(2000);
    expect(cell('answer-2').textContent).toBe('0');
    expect(mistake).not.toHaveBeenCalled();
    expect(container.querySelector('[data-anchor="hint-digit"]')).toBeNull();
  });
  it('shows operand help after a settled error without erasing or locking the cell', () => {
    render(); write('answer-2', '7'); advance(1200);
    expect(mistake).toHaveBeenCalledTimes(1);
    expect(cell('answer-2').textContent).toBe('7');
    expect(cell('answer-2').getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('[data-anchor="operand-2"]')?.getAttribute('data-cue')).toBe('operand');
    expect(container.querySelector('[data-anchor="multiplier"]')?.getAttribute('data-cue')).toBe('multiplier');
    expect(container.textContent).toContain('Multiplique');
    write('answer-0', '1'); expect(cell('answer-0').textContent).toBe('1');
    expect(cell('answer-0').dataset.selected).toBe('true');
  });
  it('maps 30 to its carry and units, then releases help after that column is solved', () => {
    render(); click(button('Dica')); click(button('Ver resultado')); click(button('Onde escrever?'));
    expect(container.querySelector('[data-anchor="hint-leading"]')?.textContent).toBe('3');
    expect(container.querySelector('[data-anchor="hint-units"]')?.textContent).toBe('0');
    expect(cell('carry-1').dataset.cue).toBe('carry'); expect(cell('answer-2').dataset.cue).toBe('units');
    write('carry-1', '3'); write('answer-2', '0');
    expect(container.querySelector('[data-anchor="hint-units"]')).toBeNull();
    click(button('Dica')); click(button('Ver resultado'));
    expect(container.textContent).toContain('Some o que levou');
    expect(container.querySelector('[data-anchor="hint-digit"]')?.textContent).toBe('2');
    expect(container.querySelector('[data-anchor="hint-incoming"]')?.textContent).toBe('3');
    expect(container.textContent).toContain('12'); expect(container.textContent).toContain('15');
    click(button('Onde escrever?'));
    expect(cell('answer-0').dataset.cue).toBe('carry'); expect(cell('answer-1').dataset.cue).toBe('units');
  });
  it('pauses idle help in background, offers before revealing, and never downgrades manual detail', () => {
    render(); advance(10000); hide(true); advance(60000);
    expect(container.textContent).not.toContain('Quer uma dica?');
    hide(false); advance(15000);
    expect(container.textContent).toContain('Quer uma dica?');
    expect(container.querySelector('[data-anchor="hint-digit"]')).toBeNull();
    click(button('Dica')); click(button('Ver resultado')); click(button('Onde escrever?')); advance(100000);
    expect(container.querySelector('[data-anchor="hint-leading"]')?.textContent).toBe('3');
    click(button('Dica')); click(button('Dica'));
    write('answer-0', '1'); write('answer-1', '5'); write('answer-2', '0'); click(button('Verificar'));
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ usedHints: 3 }));
  });
  it('does not intercept Enter on help or digit keys outside its workspace', () => {
    render(); click(cell('answer-2'));
    expect(key(button('Dica'), 'Enter').defaultPrevented).toBe(false);
    expect(mistake).not.toHaveBeenCalled();
    const outside = container.querySelector<HTMLElement>('[data-outside]')!;
    expect(key(outside, '4').defaultPrevented).toBe(false);
    expect(cell('answer-2').textContent).toBe('');
    click(button('Dica')); expect(container.textContent).toContain('Multiplique');
  });
  it('supports keypad changes and read-only completion without stale input', () => {
    render(); render(25, 6, false, 'visible');
    expect(button('7').disabled).toBe(true);
    click(cell('answer-2')); click(button('7')); expect(cell('answer-2').textContent).toBe('7');
    click(button('Apagar')); expect(cell('answer-2').textContent).toBe('');
    write('answer-2', '0'); render(25, 6, true, 'visible');
    key(cell('answer-2'), '9'); click(button('9')); advance(100000);
    expect(cell('answer-2').textContent).toBe('0'); expect(mistake).not.toHaveBeenCalled();
  });
  it('rejects an explicitly incorrect carry even if the final answer is correct', () => {
    render(); write('answer-0', '1'); write('answer-1', '5'); write('answer-2', '0'); write('carry-1', '2');
    click(button('Verificar')); expect(complete).not.toHaveBeenCalled(); expect(mistake).toHaveBeenCalledTimes(1);
    expect(cell('carry-1').getAttribute('aria-invalid')).toBe('true');
    key(cell('carry-1'), 'Backspace'); click(button('Verificar')); expect(complete).toHaveBeenCalledTimes(1);
  });
  it('remounts cleanly when operands change and cancels pending callbacks on unmount', () => {
    render(); write('answer-2', '7'); render(36, 6);
    expect(cell('answer-2').textContent).toBe(''); expect(container.querySelector('[data-selected]')).toBeNull();
    act(() => root.render(null)); advance(100000); expect(mistake).not.toHaveBeenCalled();
  });
  it('does not reveal unsolicited help while a correct result awaits verification', () => {
    render(16, 4); write('answer-0', '0'); write('answer-1', '6'); write('answer-2', '4');
    advance(100000);
    expect(container.textContent).not.toContain('Quer uma dica?');
    expect(mistake).not.toHaveBeenCalled();
    click(button('Verificar')); expect(complete).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: true, usedHints: 0 }));
  });
  it('attaches arrows to measured operands/destinations and recomputes them on resize', () => {
    let offset = 0;
    const positions: Record<string, [number, number]> = {
      multiplier: [10, 100], 'operand-2': [10, 50], 'hint-multiplier': [200, 50], 'hint-digit': [240, 50],
      'hint-leading': [200, 120], 'hint-units': [240, 120], 'carry-1': [10, 0], 'answer-2': [10, 160],
    };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const anchor = this.dataset.anchor;
      const point = anchor && positions[anchor];
      if (!point) return new DOMRect(0, 0, 400 + offset, 200);
      return new DOMRect(point[0] + (anchor.startsWith('hint-') ? offset : 0), point[1], 20, 20);
    });
    render(); click(button('Dica'));
    const arrows = () => [...container.querySelectorAll<SVGPathElement>('svg[aria-hidden] > path[d^="M "]')];
    expect(arrows().some(path => path.getAttribute('d')!.startsWith('M 20 100 C ') && path.getAttribute('d')!.endsWith('210 43 L 210 50'))).toBe(true);
    expect(arrows().every(path => (path.getAttribute('d')!.match(/ C /g) ?? []).length === 2)).toBe(true);
    offset = 100; act(() => window.dispatchEvent(new Event('resize')));
    expect(arrows().some(path => path.getAttribute('d')!.startsWith('M 20 100 C ') && path.getAttribute('d')!.endsWith('310 43 L 310 50'))).toBe(true);
    click(button('Ver resultado')); click(button('Onde escrever?'));
    expect(arrows().some(path => path.getAttribute('d')!.startsWith('M 310 120 C ') && path.getAttribute('d')!.endsWith('20 -2.6 L 20 0'))).toBe(true);
    expect(arrows()).toHaveLength(2);
    expect([...container.querySelectorAll('marker')].every(marker => marker.getAttribute('refX') === '10')).toBe(true);
  });
  it('steps back within the current column and revisits hints without counting them twice', () => {
    render(); click(button('Dica')); click(button('Ver resultado')); click(button('Onde escrever?'));
    const back = () => container.querySelector<HTMLButtonElement>('[aria-label="Voltar uma dica"]')!;
    click(back()); expect(container.textContent).toContain('Veja o resultado');
    click(back()); expect(container.textContent).toContain('Multiplique');
    expect(back().disabled).toBe(true);
    expect(container.querySelector('[data-anchor="hint-digit"]')?.textContent).toBe('5');
    click(button('Ver resultado')); expect(container.textContent).toContain('Veja o resultado');
    click(button('Onde escrever?')); expect(container.textContent).toContain('Cada algarismo no seu lugar');
    write('carry-1', '3'); write('answer-2', '0'); click(button('Dica'));
    expect(container.querySelector('[data-anchor="hint-digit"]')?.textContent).toBe('2');
    expect(back().disabled).toBe(true);
    write('answer-0', '1'); write('answer-1', '5'); click(button('Verificar'));
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ usedHints: 4 }));
  });
});
