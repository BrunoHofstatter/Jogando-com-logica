import { useCallback, useEffect, useRef, useState } from 'react';
import { LevelConfig, RoundResult } from '../Logic/gameTypes';
import { acceptsSelectionCount, chooseNextLevelTarget, createLevelRangeQueue, getLevelSelectionRule,
  getSelectionCounts, isLevelComplete } from '../Logic/levelGameLogic';

type Phase = 'idle' | 'rolling' | 'playing' | 'feedback' | 'complete' | 'unavailable';

const initialState = () => ({
  phase: 'idle' as Phase,
  currentRound: 1,
  target: 0,
  range: [0, 0] as [number, number],
  rangeQueue: [] as [number, number][],
  rollingDuration: 2000,
  selected: [] as number[],
  locked: [] as number[],
  attempts: [] as RoundResult[],
  totalTime: 0,
  feedback: null as RoundResult | null,
});

export function useSoloLevelGame(config: LevelConfig, recordAttempt: (correct: boolean) => unknown) {
  const [game, setGame] = useState(initialState);
  const [liveTime, setLiveTime] = useState(0);
  const [rollingNumber, setRollingNumber] = useState(0);
  const [selectionNotice, setSelectionNotice] = useState(false);
  const attemptStartedAt = useRef<number | null>(null);
  const submitting = useRef(false);
  const allNumbers = Array.from({ length: config.boardSize ** 2 }, (_, index) => index + 1);
  const selectionRule = getLevelSelectionRule(config, allNumbers.length - game.locked.length);

  useEffect(() => {
    if (game.phase !== 'playing') return;
    attemptStartedAt.current = performance.now();
    submitting.current = false;
    const interval = window.setInterval(() => {
      if (attemptStartedAt.current !== null) setLiveTime((performance.now() - attemptStartedAt.current) / 1000);
    }, 100);
    return () => {
      window.clearInterval(interval);
      attemptStartedAt.current = null;
    };
  }, [game.phase]);

  useEffect(() => {
    if (!selectionNotice) return;
    const timeout = window.setTimeout(() => setSelectionNotice(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [selectionNotice]);

  useEffect(() => {
    if (game.phase !== 'rolling') return;
    const range = game.range;
    const interval = window.setInterval(() => {
      setRollingNumber(Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]);
    }, 50);
    const timeout = window.setTimeout(() => {
      setGame(current => ({ ...current, phase: 'playing', feedback: null }));
    }, game.rollingDuration);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [game.phase, game.range, game.rollingDuration]);

  useEffect(() => {
    if (game.phase !== 'feedback' || !game.feedback) return;
    const feedback = game.feedback;
    // Cells retain their feedback appearance briefly, then the selection clears.
    const clear = window.setTimeout(() => setGame(current => ({ ...current, selected: [] })), 650);
    const isFinal = feedback.correct && isLevelComplete(config, game.currentRound, game.locked.length);
    const timeout = window.setTimeout(() => {
      if (isFinal) {
        setGame(current => ({ ...current, phase: 'complete', feedback: null }));
        return;
      }
      const nextRound = game.currentRound + (feedback.correct ? 1 : 0);
      const available = Array.from({ length: config.boardSize ** 2 }, (_, index) => index + 1)
        .filter(number => !game.locked.includes(number));
      const next = chooseNextLevelTarget(config, available, nextRound, game.rangeQueue,
        feedback.correct ? undefined : feedback.magicNumber, feedback.correct ? undefined : game.range);
      setGame(current => ({ ...current, currentRound: nextRound, target: next.target ?? 0,
        range: next.range, rangeQueue: next.rangeQueue,
        rollingDuration: feedback.correct ? 2000 : 1000,
        phase: next.target === null ? 'unavailable' : 'rolling', feedback: null }));
    }, isFinal ? 650 : 2000);
    return () => { window.clearTimeout(clear); window.clearTimeout(timeout); };
  }, [game.phase, game.feedback, game.currentRound, game.locked, game.rangeQueue, game.range, config]);

  const start = () => {
    if (game.phase !== 'idle') return;
    const next = chooseNextLevelTarget(config, allNumbers, 1, createLevelRangeQueue(config));
    setRollingNumber(next.range[0]);
    setGame(current => ({ ...current, target: next.target ?? 0, range: next.range, rangeQueue: next.rangeQueue,
      phase: next.target === null ? 'unavailable' : 'rolling' }));
  };

  const select = (number: number) => {
    if (game.phase !== 'playing' || selectionNotice || submitting.current || game.locked.includes(number)) return;
    const maximum = Math.max(...getSelectionCounts(selectionRule));
    setGame(current => ({ ...current, selected: current.selected.includes(number)
      ? current.selected.filter(value => value !== number)
      : current.selected.length < maximum ? [...current.selected, number] : current.selected }));
  };

  const submit = useCallback(() => {
    if (game.phase !== 'playing' || selectionNotice || submitting.current || attemptStartedAt.current === null) return;
    if (!acceptsSelectionCount(selectionRule, game.selected.length)) {
      setSelectionNotice(true);
      return;
    }
    submitting.current = true;
    const timeTaken = (performance.now() - attemptStartedAt.current) / 1000;
    attemptStartedAt.current = null;
    const sum = game.selected.reduce((total, number) => total + number, 0);
    const result: RoundResult = { roundNumber: game.currentRound, magicNumber: game.target,
      selectedNumbers: [...game.selected], sum, correct: sum === game.target, timeTaken };
    setLiveTime(0);
    setGame(current => ({ ...current, phase: 'feedback', feedback: result,
      attempts: [...current.attempts, result], totalTime: current.totalTime + timeTaken,
      locked: result.correct ? [...current.locked, ...result.selectedNumbers] : current.locked }));
    recordAttempt(result.correct);
  }, [game, selectionRule, selectionNotice, recordAttempt]);

  const retry = () => {
    submitting.current = false;
    attemptStartedAt.current = null;
    setLiveTime(0);
    setRollingNumber(0);
    setSelectionNotice(false);
    setGame(initialState());
  };

  return { game, liveTime, rollingNumber, selectionNotice, selectionRule, dismissNotice: () => setSelectionNotice(false),
    start, select, submit, retry };
}
