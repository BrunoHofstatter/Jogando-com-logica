import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLevelById, getTotalLevels } from '../Logic/levelConfigs';
import { calculateStars, updateLevelProgress, isLevelUnlocked } from '../Logic/levelProgress';
import { LevelConfig, RoundResult } from '../Logic/gameTypes';
import LevelResultModal from '../componentes/LevelResultModal';
import Tabuleiro from '../componentes/tabuleiro';
import Girar from '../componentes/sorteio';
import GameButton from '../componentes/GameButton';
import RoundTracker from '../componentes/RoundTracker';
import styles from '../styles/levelGame.module.css';
import DynamicTutorial, { TutorialStep } from '../../Shared/Components/DynamicTutorial';
import tutorialStyles from '../styles/DynamicTutorial.module.css';
import { ROUTES } from "../../routes";
import { analytics, formatLevelId } from "../../analytics/events";
import { useLevelAttemptAnalytics } from "../../analytics/useLevelAttemptAnalytics";

const LEVEL_TUTORIAL_ID = "caca_soma_levels_v1";
const LEVEL_TUTORIAL_STEP_IDS = [
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
] as const;

function LevelGamePage() {

  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  // Game state
  const [sorteado, setSorteado] = useState(0);
  const [soma, setSoma] = useState(0);
  const [quantos, setQuantos] = useState(0);
  const [jogar, setJogar] = useState(false);
  const [clicar, setClicar] = useState(true);
  const [liveTime, setLiveTime] = useState(0);
  const [okayFunction, setOkayFunction] = useState<(() => void) | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [nextRoundCountdown, setNextRoundCountdown] = useState<number | null>(null);
  const [lastRoundWasCorrect, setLastRoundWasCorrect] = useState<boolean | null>(null);

  // Additional state for logic and reset
  const [gameKey, setGameKey] = useState(0);
  const [usedIndices, setUsedIndices] = useState<Set<string>>(new Set());
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

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
          <span>- Selecione <span className={tutorialStyles.highlight}>2 números</span></span>
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
          <span>- Acerte todas as rodadas para ganhar <span className={tutorialStyles.highlight}>3 estrelas</span></span>
        </div>
      )
    }
  ];

  const { completeAttempt, recordRound, startAttempt } =
    useLevelAttemptAnalytics(
      levelConfig
        ? {
            gameId: "caca_soma",
            levelId: formatLevelId(levelConfig.levelId),
            gameMode: "solo",
            usageContext: "standard",
            participantCount: 1,
          }
        : null,
    );

  // Load level config on mount
  useEffect(() => {
    if (levelId) {
      const level = getLevelById(parseInt(levelId));
      if (level) {
        setLevelConfig(level);
      } else {
        // Level not found, redirect back
        navigate(ROUTES.CACA_SOMA_LEVELS);
      }
    }
  }, [levelId, navigate]);

  // Check tutorial on mount
  useEffect(() => {
    const completed = localStorage.getItem('tutorial_cacasoma_levels_v1_completed');
    if (completed !== 'true') {
      const timer = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (jogar) {
      startAttempt();
    }
  }, [jogar, startAttempt]);

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

  // Toggle functions
  const mudarJogar = useCallback(() => setJogar(prev => !prev), []);
  const mudarClicar = useCallback(() => setClicar(prev => !prev), []);
  const mudarSorteado = useCallback((x: number) => setSorteado(x), []);
  const mudarSoma = useCallback((x: number) => setSoma(prev => prev + x), []);

  // Update used indices when a correct match occurs
  const handleCorrectMatch = useCallback((indices: string[]) => {
    setUsedIndices(prev => {
      const next = new Set(prev);
      indices.forEach(idx => next.add(idx));
      return next;
    });
  }, []);

  // Calculate available numbers for the generator
  const getAvailableNumbers = useCallback(() => {
    if (!levelConfig) return [];
    const boardSize = levelConfig.boardSize;
    const allNumbers: number[] = [];
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const key = `${r}-${c}`;
        if (!usedIndices.has(key)) {
          // Calculate valid number based on grid position
          allNumbers.push(r * boardSize + c + 1);
        }
      }
    }
    return allNumbers;
  }, [levelConfig, usedIndices]);

  // Start Game handler (called by "Começar" button)
  const onStartGame = () => {
    mudarClicar(); // This triggers Girar effect
  };

  // Automatically start every round after the first one.
  useEffect(() => {
    if (nextRoundCountdown === null) return;

    const timeout = window.setTimeout(() => {
      if (nextRoundCountdown === 1) {
        setNextRoundCountdown(null);
        setLastRoundWasCorrect(null);
        setClicar(false); // This triggers the Magic Number rolling animation.
        return;
      }

      setNextRoundCountdown(nextRoundCountdown - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [nextRoundCountdown]);

  // Handle time updates from timer
  const onTimeUpdate = useCallback((tempo: number) => {
    setLiveTime(tempo);
  }, []);

  // Handle round submission
  const noOp = useCallback(() => { }, []);

  const finishLevel = useCallback((results: RoundResult[], finalTime: number) => {
    if (!levelConfig) return;

    const correctCount = results.filter(r => r.correct).length;
    const stars = calculateStars(correctCount, finalTime, levelConfig.levelId);
    setStarsEarned(stars);

    updateLevelProgress({
      levelId: levelConfig.levelId,
      rounds: results,
      totalCorrect: correctCount,
      totalTime: finalTime,
      starsEarned: stars,
      passed: stars >= 2
    });

    completeAttempt({
      success: stars >= 2,
      outcome: stars >= 2 ? "passed" : "failed",
      starsEarned: stars,
    });
    setShowResultModal(true);
  }, [completeAttempt, levelConfig]);

  const addTempo = useCallback((tempo: number, currentSoma?: number) => {
    const actualSoma = currentSoma !== undefined ? currentSoma : soma;
    const isCorrect = sorteado === actualSoma;

    // Record round result
    const result: RoundResult = {
      roundNumber: currentRound,
      magicNumber: sorteado,
      selectedNumbers: selectedNumbers, // Store selected numbers
      sum: actualSoma,
      correct: isCorrect,
      timeTaken: tempo
    };

    setRoundResults(prev => [...prev, result]);
    setTotalTime(prev => prev + tempo);
    setLiveTime(0);
    recordRound(isCorrect);

    // Move to next round or finish
    if (levelConfig && currentRound < levelConfig.rounds) {
      setLastRoundWasCorrect(isCorrect);
      setNextRoundCountdown(5);
      setCurrentRound(prev => prev + 1);
      setSorteado(0);
      setSoma(0);
      setQuantos(0);
      setSelectedNumbers([]); // Reset selected numbers
      setJogar(false);
      setClicar(true);
    } else {
      // Level complete, navigate to results
      setGameOver(true);
      finishLevel([...roundResults, result], totalTime + tempo);
    }
  }, [currentRound, finishLevel, levelConfig, recordRound, roundResults, selectedNumbers, soma, sorteado, totalTime]);

  const handleRetry = () => {
    setShowResultModal(false);
    setRoundResults([]);
    setCurrentRound(1);
    setSorteado(0);
    setSoma(0);
    setQuantos(0);
    setJogar(false);
    setClicar(true);
    setTotalTime(0);
    setLiveTime(0);
    setGameOver(false);
    setNextRoundCountdown(null);
    setLastRoundWasCorrect(null);
    // Reset board and used numbers
    setGameKey(prev => prev + 1);
    setUsedIndices(new Set());
  };

  const handleNextLevel = () => {
    if (levelConfig && levelConfig.levelId < getTotalLevels()) {
      const nextId = levelConfig.levelId + 1;
      navigate(`${ROUTES.CACA_SOMA_LEVEL_BASE}/${nextId}`);
      setShowResultModal(false);
      setRoundResults([]);
      setCurrentRound(1);
      setSorteado(0);
      setSoma(0);
      setQuantos(0);
      setJogar(false);
      setClicar(true);
      setTotalTime(0);
      setLiveTime(0);
      setGameOver(false);
      setNextRoundCountdown(null);
      setLastRoundWasCorrect(null);
      // Reset board and used numbers
      setGameKey(prev => prev + 1);
      setUsedIndices(new Set());
    }
  };

  const handleMenu = () => {
    navigate(ROUTES.CACA_SOMA_LEVELS);
  };

  // Get current round's magic number range
  const getCurrentRange = (): [number, number] | undefined => {
    if (!levelConfig) return undefined;
    return levelConfig.randomNumberRanges[currentRound - 1];
  };

  // Global click handler for submitting the game (replacing the button)
  const handleGlobalClick = () => {
    if (jogar && okayFunction) {
      okayFunction();
    }
  };

  // Listen for "Enter" key to submit
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && jogar && okayFunction) {
        event.preventDefault();
        okayFunction();
      }
    };

    if (jogar && okayFunction) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [jogar, okayFunction]);

  if (!levelConfig) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={styles.container} onClick={handleGlobalClick}>
      <div className={styles.leftPanel}>
        {/* Magic number & Controls */}
        <div className={styles.controlsBox}>
          <div data-target="step5" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <RoundTracker levelId={levelConfig.levelId} currentRound={currentRound} totalRounds={levelConfig.rounds} />
          </div>

          <div data-target="step1" className={styles.magicAndButton}>
            <div className={styles.magicNumberContainer}>
              <div className={styles.magicNumberTextColumn}>
                <span className={styles.magicNumberTitle}>Número</span>
                <span className={styles.magicNumberTitle}>Mágico</span>
              </div>
              <div className={styles.magicNumberDisplay}>
                <Girar
                  mudarJogar={mudarJogar}
                  clicar={clicar}
                  mudarSorteado={mudarSorteado}
                  rodada={currentRound}
                  customRange={getCurrentRange()}
                  availableNumbers={getAvailableNumbers()}
                  numbersToSelect={levelConfig.numbersToSelect}
                />
              </div>
            </div>
            {jogar ? (
              <div className={styles.instructionText}>
                Clique fora do tabuleiro para confirmar
              </div>
            ) : (
              <GameButton
                jogar={jogar}
                clicar={clicar}
                gameOver={gameOver}
                onStartGame={onStartGame}
                onSubmit={okayFunction || undefined}
              />
            )}
          </div>

          <div className={styles.timerDisplay} data-target="step4">
            <span className={styles.timerLabel}>Tempo Total:</span>
            <span className={styles.timerValue}>{(totalTime + liveTime).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Game board */}
      <div className={styles.rightPanel} data-target="step2">
        <Tabuleiro
          key={`${gameKey}-${levelConfig.levelId}`}
          mudarClicar={mudarClicar}
          mudarJogar={mudarJogar}
          mudarRodada={noOp} // No-op for level mode, stable reference
          mudarSoma={mudarSoma}
          addTempo={addTempo}
          soma={soma}
          jogar={jogar}
          qualRodada={currentRound}
          quantos={quantos}
          setQuantos={setQuantos}
          sorteado={sorteado}
          onTimeUpdate={onTimeUpdate}
          onOkayChange={setOkayFunction}
          boardSize={levelConfig.boardSize}
          maxSelections={levelConfig.numbersToSelect}
          customStyles={styles}
          onCorrectMatch={handleCorrectMatch}
          onSelectionChange={setSelectedNumbers}
        />
      </div>


      {showResultModal && (
        <LevelResultModal
          levelId={levelConfig.levelId}
          rounds={roundResults}
          totalCorrect={roundResults.filter(r => r.correct).length}
          totalTime={totalTime}
          starsEarned={starsEarned}
          maxCorrect={levelConfig.rounds}
          nextLevelUnlocked={isLevelUnlocked(levelConfig.levelId + 1)}
          onRetry={handleRetry}
          onNextLevel={handleNextLevel}
          onMenu={handleMenu}
        />
      )}
      {nextRoundCountdown !== null && (
        <div className={styles.roundTransitionOverlay} aria-live="polite">
          <div className={styles.roundTransitionCard}>
            <span className={styles.roundTransitionResult}>
              {lastRoundWasCorrect ? 'Acertou!' : 'Não foi dessa vez'}
            </span>
            <span className={styles.roundTransitionLabel}>Próxima rodada em</span>
            <span className={styles.roundTransitionCountdown}>{nextRoundCountdown}</span>
          </div>
        </div>
      )}
      {showTutorial && (
        <DynamicTutorial
          steps={tutorialSteps}
          onStart={handleTutorialStart}
          onStepChange={handleTutorialStepChange}
          onFinish={handleTutorialFinish}
          storageKey="cacasoma_levels_v1"
          locale="pt"
          styles={tutorialStyles}
        />
      )}
    </div>
  );
}

export default LevelGamePage;
