import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLevelById } from '../Logic/levelConfigs';
import { calculateStars, updateLevelProgress, isLevelUnlocked } from '../Logic/levelProgress';
import { LevelConfig } from '../Logic/gameTypes';
import { displayLevelSeconds, getSelectionCounts, isLevelComplete } from '../Logic/levelGameLogic';
import { useSoloLevelGame } from '../Hooks/useSoloLevelGame';
import LevelResultModal from '../componentes/LevelResultModal';
import GameButton from '../componentes/GameButton';
import RoundTracker from '../componentes/RoundTracker';
import styles from '../styles/levelGame.module.css';
import DynamicTutorial, { TutorialStep } from '../../Shared/Components/DynamicTutorial';
import tutorialStyles from '../styles/DynamicTutorial.module.css';
import { ROUTES } from '../../routes';
import { analytics, formatLevelId } from '../../analytics/events';
import { useLevelAttemptAnalytics } from '../../analytics/useLevelAttemptAnalytics';

const LEVEL_TUTORIAL_ID = 'caca_soma_levels_v1';
const LEVEL_TUTORIAL_STEP_IDS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

function LevelGamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const config = getLevelById(Number(levelId));
  useEffect(() => {
    if (!config) navigate(ROUTES.CACA_SOMA_LEVELS, { replace: true });
  }, [config, navigate]);
  // Route changes and revisits always create a fresh level session.
  return config ? <LevelSession key={config.levelId} levelConfig={config} /> : null;
}

function LevelSession({ levelConfig }: { levelConfig: LevelConfig }) {
  const navigate = useNavigate();
  const savedResult = useRef(false);
  const { completeAttempt, recordRound, startAttempt } = useLevelAttemptAnalytics({
    gameId: 'caca_soma', levelId: formatLevelId(levelConfig.levelId), gameMode: 'solo',
    usageContext: 'standard', playerSlotCount: 1,
  });
  const { game, liveTime, rollingNumber, selectionNotice, selectionRule, dismissNotice, start, select, submit, retry } =
    useSoloLevelGame(levelConfig, recordRound);
  const correctCount = game.attempts.filter(attempt => attempt.correct).length;
  const starsEarned = calculateStars(correctCount, game.totalTime, levelConfig.levelId, game.locked.length);
  const selectionCounts = getSelectionCounts(selectionRule);
  const selectionText = selectionCounts.join(' ou ');
  const selectionNoun = selectionRule === 1 ? 'número' : 'números';
  const clearsBoard = levelConfig.completionRule === 'clear-board';
  const feedback = game.phase === 'feedback' ? game.feedback : null;
  const lastAttempt = game.attempts[game.attempts.length - 1];
  const hasNextLevel = Boolean(getLevelById(levelConfig.levelId + 1));

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialStartedRef = useRef(false);
  const tutorialFinishedRef = useRef(false);
  const tutorialStepIdRef = useRef<string>(LEVEL_TUTORIAL_STEP_IDS[0]);
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'step1',
      target: '[data-target="step1"]',
      highlight: true,
      placement: 'auto',
      title: 'Começar',
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>- O <span className={tutorialStyles.highlight}>Número Mágico</span> vai ser sorteado</span>
          <span>- Clique em <span className={tutorialStyles.highlight}>Começar</span> para iniciar o nível</span>
          <span>- As próximas rodadas começam <span className={tutorialStyles.highlight}>automaticamente</span></span>
        </div>
      )
    },
    {
      id: 'step2',
      target: '[data-target="step2"]',
      highlight: true,
      placement: 'left',
      title: 'Tabuleiro',
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>- Selecione <span className={tutorialStyles.highlight}>{selectionText} {selectionNoun}</span></span>
          <span>- A soma deles deve ser <span className={tutorialStyles.highlight}>igual</span> ao Número Mágico</span>
        </div>
      )
    },
    {
      id: 'step3',
      target: 'none',
      highlight: true,
      placement: 'center',
      title: 'Finalizar',
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>- Clique <span className={tutorialStyles.highlight}>Fora do Tabuleiro</span> quando terminar</span>
        </div>
      )
    },
    {
      id: 'step4',
      target: '[data-target="step4"]',
      highlight: true,
      placement: 'auto',
      title: 'Tempo',
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>- Este é seu <span className={tutorialStyles.highlight}>tempo total</span></span>
          <span>- Tente ser <span className={tutorialStyles.highlight}>rápido!</span></span>
        </div>
      )
    },
    {
      id: 'step5',
      target: '[data-target="step5"]',
      highlight: true,
      placement: 'auto',
      title: 'Rodadas',
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>- {clearsBoard ? 'Marque todos os números' : 'Conclua todas as rodadas'} para ganhar <span className={tutorialStyles.highlight}>1 estrela</span></span>
          <span>- Termine mais rápido para ganhar <span className={tutorialStyles.highlight}>2 ou 3 estrelas</span></span>
        </div>
      )
    }
  ];


  useEffect(() => {
    const completed = localStorage.getItem('tutorial_cacasoma_levels_v1_completed');
    if (completed !== 'true') {
      const timer = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTutorialStart = useCallback(() => {
    if (tutorialStartedRef.current) {
      return;
    }

    tutorialStartedRef.current = true;
    analytics.tutorialBegan({
      gameId: "caca_soma",
      tutorialId: LEVEL_TUTORIAL_ID,
    });
  }, []);

  const handleTutorialStepChange = useCallback((index: number) => {
    tutorialStepIdRef.current =
      LEVEL_TUTORIAL_STEP_IDS[index] ?? LEVEL_TUTORIAL_STEP_IDS[0];
  }, []);

  const handleTutorialFinish = useCallback((skipped: boolean) => {
    if (tutorialFinishedRef.current) {
      return;
    }

    tutorialFinishedRef.current = true;

    if (skipped) {
      analytics.tutorialSkipped({
        gameId: "caca_soma",
        tutorialId: LEVEL_TUTORIAL_ID,
        stepId: tutorialStepIdRef.current,
      });
    } else {
      analytics.tutorialCompleted({
        gameId: "caca_soma",
        tutorialId: LEVEL_TUTORIAL_ID,
      });
    }

    setShowTutorial(false);
  }, []);


  useEffect(() => {
    if (game.phase === 'playing') startAttempt();
  }, [game.phase, startAttempt]);

  useEffect(() => {
    if (game.phase !== 'complete' || savedResult.current) return;
    savedResult.current = true;
    updateLevelProgress({ levelId: levelConfig.levelId, rounds: game.attempts,
      totalCorrect: correctCount, totalTime: game.totalTime, starsEarned, passed: starsEarned >= 2 });
    completeAttempt({ success: starsEarned >= 2, outcome: starsEarned >= 2 ? 'passed' : 'failed', starsEarned });
  }, [game.phase, game.attempts, game.totalTime, correctCount, starsEarned, levelConfig.levelId, completeAttempt]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.repeat && !showTutorial && game.phase === 'playing') {
        if (event.target instanceof HTMLElement && event.target.closest('[data-number]')) return;
        event.preventDefault();
        if (selectionNotice) dismissNotice();
        else submit();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [submit, dismissNotice, selectionNotice, showTutorial, game.phase]);

  const handleRetry = () => { savedResult.current = false; retry(); };

  return (
    <div className={styles.container} onClick={() => { if (!showTutorial) submit(); }}>
      <div className={styles.leftPanel}>
        <div className={styles.controlsBox}>
          <div data-target="step5" className={styles.trackerWrapper}>
            <RoundTracker levelId={levelConfig.levelId} currentRound={game.currentRound}
              totalRounds={levelConfig.rounds} completedRounds={correctCount}
              totalCells={clearsBoard ? levelConfig.boardSize ** 2 : undefined} completedCells={game.locked.length} />
          </div>
          <div data-target="step1" className={styles.magicAndButton}>
            <div className={styles.magicNumberContainer}>
              <div className={styles.magicNumberTextColumn}>
                <span className={styles.magicNumberTitle}>Número</span>
                <span className={styles.magicNumberTitle}>Mágico</span>
              </div>
              <div className={styles.magicNumberDisplay} data-magic-number aria-label="Número Mágico">
                {game.phase === 'rolling' ? rollingNumber : game.target || '—'}
              </div>
            </div>
            {game.phase === 'idle' ? (
              <GameButton jogar={false} clicar gameOver={false} onStartGame={() => { if (!showTutorial) start(); }} />
            ) : (
              <div className={styles.instructionText}>
                {game.phase === 'playing' ? 'Clique fora do tabuleiro para confirmar' :
                  game.phase === 'rolling' ? 'Sorteando...' : 'Aguarde...'}
              </div>
            )}
          </div>
          <div className={styles.timerDisplay} data-target="step4">
            <span className={styles.timerLabel}>Tempo Total:</span>
            <span className={styles.timerValue} data-level-time>{displayLevelSeconds(game.totalTime + liveTime)}s</span>
          </div>
        </div>
      </div>
      <div className={styles.rightPanel} data-target="step2">
        <p className={styles.selectionInstruction}>Use {selectionCounts.map((count, index) => (
          <span key={count}>{index > 0 && ' ou '}<strong>{count}</strong></span>
        ))} {selectionNoun}</p>
        <div className={styles.boardSurface}>
          <div className={styles.board} data-target="tabuleiro" onClick={event => event.stopPropagation()}
          style={{ gridTemplateColumns: 'repeat(' + levelConfig.boardSize + ', 1fr)',
            '--board-size': levelConfig.boardSize } as CSSProperties}>
          {Array.from({ length: levelConfig.boardSize ** 2 }, (_, index) => index + 1).map(number => {
            const selected = game.selected.includes(number);
            const locked = game.locked.includes(number);
            const feedbackClass = selected && feedback ? feedback.correct ? styles.cellSuccess : styles.cellError : '';
            return <button key={number} type="button" data-number={number}
              aria-label={'Número ' + number + (locked ? ', já usado' : '')} aria-pressed={selected}
              disabled={game.phase !== 'playing' || locked || selectionNotice || showTutorial}
              className={[styles.celula, locked ? styles.cellCorrect : selected ? styles.cellSelected : styles.cellDefault, feedbackClass].join(' ')}
              onClick={() => select(number)}>{number}</button>;
          })}
          </div>
          {feedback && !feedback.correct && (
            <div className={styles.retryOverlay}>
              <div className={styles.retryFeedback} role="status">
                <strong>Tente novamente</strong>
                <span>Sua soma foi <b className={styles.attemptedSum}>{feedback.sum}</b>.</span>
                <span>O número mágico era <b className={styles.feedbackTarget}>{feedback.magicNumber}</b>.</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {lastAttempt && (
        <div key={game.attempts.length} className={[styles.screenPulse, lastAttempt.correct ? styles.screenSuccess : styles.screenError].join(' ')} aria-hidden="true" />
      )}
      {feedback?.correct && !isLevelComplete(levelConfig, correctCount, game.locked.length) && (
        <div className={styles.successOverlay} role="status">
          <div className={styles.successCard}>
            <strong>Acertou!</strong>
            <span>Prepare-se para a próxima rodada</span>
          </div>
        </div>
      )}
      {selectionNotice && (
        <div className={styles.selectionNoticeOverlay} onClick={event => { event.stopPropagation(); dismissNotice(); }}>
          <div className={styles.selectionNotice} role="alert">
            Selecione <strong>{selectionText}</strong> {selectionNoun} para confirmar.
          </div>
        </div>
      )}
      {game.phase === 'unavailable' && (
        <div className={styles.selectionNoticeOverlay} onClick={event => event.stopPropagation()}>
          <div className={styles.selectionNotice} role="alert">
            Não há números suficientes para continuar.
            <button type="button" onClick={handleRetry}>Tentar novamente</button>
          </div>
        </div>
      )}
      {game.phase === 'complete' && (
        <LevelResultModal levelId={levelConfig.levelId} rounds={game.attempts} totalTime={game.totalTime}
          starsEarned={starsEarned} hasNextLevel={hasNextLevel}
          nextLevelUnlocked={starsEarned >= 2 || isLevelUnlocked(levelConfig.levelId + 1)}
          onRetry={handleRetry} onNextLevel={() => navigate(ROUTES.CACA_SOMA_LEVEL_BASE + '/' + (levelConfig.levelId + 1))}
          onMenu={() => navigate(ROUTES.CACA_SOMA_LEVELS)} />
      )}
      {showTutorial && (
        <DynamicTutorial steps={tutorialSteps} onStart={handleTutorialStart} onStepChange={handleTutorialStepChange}
          onFinish={handleTutorialFinish} storageKey="cacasoma_levels_v1" locale="pt" styles={tutorialStyles} />
      )}
    </div>
  );
}

export default LevelGamePage;
