// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LevelGamePage from './LevelGamePage';
import { levels } from '../Logic/levelConfigs';
import { getLevelProgress, isLevelUnlocked } from '../Logic/levelProgress';
import { ROUTES } from '../../routes';

const analytics = vi.hoisted(() => ({ startAttempt: vi.fn(), completeAttempt: vi.fn(), recordRound: vi.fn() }));
vi.mock('../../analytics/useLevelAttemptAnalytics', () => ({ useLevelAttemptAnalytics: () => analytics }));

let container: HTMLDivElement, root: Root;
const originalLevel = { ...levels[0] };
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] });
  vi.spyOn(Math, 'random').mockReturnValue(0);
  localStorage.clear();
  localStorage.setItem('tutorial_cacasoma_levels_v1_completed', 'true');
  Object.assign(levels[0], { rounds: 2, randomNumberRanges: [[3, 15], [5, 20]] });
  Object.values(analytics).forEach(mock => mock.mockClear());
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  Object.assign(levels[0], originalLevel);
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
function Navigation() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate('/away')}>Leave</button><button onClick={() => navigate(ROUTES.CACA_SOMA_LEVEL_BASE + '/1')}>Return</button></>;
}
function render() {
  act(() => root.render(<MemoryRouter initialEntries={[ROUTES.CACA_SOMA_LEVEL_BASE + '/1']}>
    <Navigation /><Routes><Route path={ROUTES.CACA_SOMA_LEVEL_BASE + '/:levelId'} element={<LevelGamePage />} /><Route path="/away" element={<div>Away</div>} /></Routes>
  </MemoryRouter>));
}
const click = (node: HTMLElement) => act(() => node.click());
const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent === text)!;
const cell = (number: number) => container.querySelector<HTMLButtonElement>('[data-number="' + number + '"]')!;
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const target = () => Number(container.querySelector('[data-magic-number]')!.textContent);
const time = () => container.querySelector('[data-level-time]')!.textContent;
const submit = () => click(container.querySelector('[data-magic-number]') as HTMLElement);
function start() { click(button('Começar')); advance(2000); }
function solvePair() {
  const available = [...container.querySelectorAll<HTMLButtonElement>('[data-number]')].filter(node => !node.disabled).map(node => Number(node.dataset.number));
  for (const left of available) for (const right of available) if (left < right && left + right === target()) {
    click(cell(left)); click(cell(right)); submit(); return [left, right];
  }
  throw new Error('No solution for target ' + target());
}

it('retries the same round with a different target, clears wrong cells, locks only correct cells, and excludes waits from time', () => {
  render(); start();
  const firstTarget = target();
  advance(1200); click(cell(24)); click(cell(25)); submit();
  expect(analytics.recordRound).toHaveBeenLastCalledWith(false);
  expect(container.textContent).toContain('Rodada 1/2');
  expect(container.textContent).toContain('Sua soma foi 49.');
  expect(container.querySelector('[role="status"]')?.closest('[data-target="step2"]')).not.toBeNull();
  expect(container.querySelector('[aria-current="step"]')?.textContent).toBe('1');
  expect(cell(24).className).toContain('cellError');
  expect(time()).toBe('2s');
  advance(650);
  expect(cell(24).getAttribute('aria-pressed')).toBe('false');
  advance(1350); advance(1000);
  expect(target()).not.toBe(firstTarget);
  expect(container.textContent).toContain('Rodada 1/2');
  expect(cell(24).disabled).toBe(false);
  expect(time()).toBe('2s');
  advance(1800); const locked = solvePair();
  expect(container.querySelector('[data-status="completed"] small')?.textContent).toBe('✓');
  advance(2000); advance(2000);
  expect(container.textContent).toContain('Rodada 2/2');
  expect(time()).toBe('3s');
  locked.forEach(number => expect(cell(number).disabled).toBe(true));
  advance(2000); solvePair(); advance(650);
  expect(container.textContent).toContain('Nível 1 concluído!');
  expect(container.textContent).toContain('Erros: 1');
  expect(container.textContent).toContain('Tempo: 5s');
  expect(analytics.completeAttempt).toHaveBeenCalledExactlyOnceWith({ success: true, outcome: 'passed', starsEarned: 3 });
  expect(isLevelUnlocked(2)).toBe(true);
  click(button('Ver detalhes das rodadas'));
  expect(container.textContent).toContain('Rodada 1 · 3s · 1 erro');
  const details = container.querySelector<HTMLElement>('[aria-labelledby="round-details-title"]')!;
  expect(details).not.toBeNull();
  expect(container.querySelector('[aria-labelledby="level-result-title"]')?.contains(details)).toBe(false);
  expect(container.querySelector('[aria-labelledby="level-result-title"]')?.hasAttribute('inert')).toBe(true);
  act(() => details.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(container.querySelector('[aria-labelledby="round-details-title"]')).toBeNull();
  expect(document.activeElement).toBe(button('Ver detalhes das rodadas'));
  click(button('Tentar novamente'));
  expect(button('Começar')).toBeDefined();
  expect(time()).toBe('0s');
  expect(cell(locked[0]).className).not.toContain('cellCorrect');
  expect(getLevelProgress(1)?.bestStars).toBe(3);
});

it('auto-dismisses an incomplete-selection popup without recording a mistake or pausing time', () => {
  levels[0].numbersToSelect = 3;
  render(); start();
  click(cell(1)); click(cell(2)); submit();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Selecione 3 números');
  expect(analytics.recordRound).not.toHaveBeenCalled();
  advance(2500);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(time()).toBe('3s');
  expect(cell(1).getAttribute('aria-pressed')).toBe('true');
  click(cell(3)); submit();
  expect(analytics.recordRound).toHaveBeenLastCalledWith(true);
});

it('awards one star after a slow completion, keeps the next level locked, and starts fresh after leaving', () => {
  render(); start();
  advance(120000); solvePair(); advance(2000); advance(2000);
  solvePair(); advance(650);
  expect(container.textContent).toContain('Nível 1 concluído!');
  expect(container.textContent).toContain('Conquiste 2 estrelas');
  expect(isLevelUnlocked(2)).toBe(false);
  expect(getLevelProgress(1)?.completed).toBe(true);
  click(button('Tentar novamente')); start(); solvePair(); advance(2000); advance(2000);
  click(button('Leave')); click(button('Return'));
  expect(container.textContent).toContain('Rodada 1/2');
  expect(time()).toBe('0s');
  expect(button('Começar')).toBeDefined();
  expect(getLevelProgress(1)?.bestStars).toBe(1);
});

it('preserves earlier earned stars and unlocks when a new completion is slower', () => {
  localStorage.setItem('cacasoma_level_progress', JSON.stringify([
    { levelId: 1, completed: true, bestStars: 3, bestTime: 20, bestCorrect: 5, attempts: 1, lastPlayed: '' },
  ]));
  render(); start(); advance(120000); solvePair(); advance(2000); advance(2000); solvePair(); advance(650);
  expect(getLevelProgress(1)?.bestStars).toBe(3);
  expect(isLevelUnlocked(2)).toBe(true);
  expect(button('Próximo nível')).toBeDefined();
});

it('accepts both triples and pairs in an optional-count level and advances to a fresh next-level session', () => {
  Object.assign(levels[0], { numbersToSelect: '2-or-3', randomNumberRanges: [[6, 6], [7, 20]] });
  render(); start();
  expect(container.textContent).toContain('Use 2 ou 3 números');
  click(cell(1)); click(cell(2)); click(cell(3)); submit();
  expect(analytics.recordRound).toHaveBeenLastCalledWith(true);
  advance(2000); advance(2000); solvePair(); advance(650);
  click(button('Próximo nível'));
  expect(container.textContent).toContain('Nível 2 - Rodada 1/5');
  expect(time()).toBe('0s');
  expect(button('Começar')).toBeDefined();
});

it('cannot finish on a wrong final answer or record a rapid duplicate submission', () => {
  render(); start(); solvePair(); advance(2000); advance(2000);
  click(cell(24)); click(cell(25));
  act(() => {
    const control = container.querySelector('[data-magic-number]') as HTMLElement;
    control.click(); control.click();
  });
  expect(analytics.recordRound).toHaveBeenCalledTimes(2);
  expect(analytics.completeAttempt).not.toHaveBeenCalled();
  advance(2000); advance(1000);
  expect(container.textContent).toContain('Rodada 2/2');
  solvePair(); advance(650);
  expect(analytics.completeAttempt).toHaveBeenCalledOnce();
  expect(container.textContent).toContain('Erros: 1');
});
