import React, { useState, useEffect, useCallback } from 'react';
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
import DynamicTutorial, { TutorialStep } from '../componentes/DynamicTutorial';

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

  // Additional state for logic and reset
  const [gameKey, setGameKey] = useState(0);
  const [usedIndices, setUsedIndices] = useState<Set<string>>(new Set());
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'step1',
      target: '[data-target="step1"]',
      highlight: true,
      placement: 'auto',
      title: 'Começar',
      body: (
        <div style={{
          fontSize: '2vw',
          color: '#eee',
          marginBottom: '24px',
          lineHeight: 1.5,
          WebkitTextStroke: '0.15vw #720b0bff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1vw'
        }}>
          <span>- O <span style={{ color: '#ffb224ff', fontSize: '2.3vw' }}>Número Mágico</span> vai ser sorteado</span>
          <span>- Clique em <span style={{ color: '#ffb224ff', fontSize: '2.3vw' }}>Começar</span> para iniciar</span>
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
        <div style={{
          fontSize: '2vw',
          color: '#eee',
          marginBottom: '24px',
          lineHeight: 1.5,
          WebkitTextStroke: '0.15vw #720b0bff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1vw'
        }}>
          <span>- Selecione <span style={{ color: '#ffb224ff', fontSize: '2.3vw' }}>2 números</span></span>
          <span>- A soma deles deve ser <span style={{ color: '#ffb224ff', fontSize: '2.3vw' }}>igual</span> ao Número Mágico</span>
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
        <div style={{
          fontSize: '2vw',
          color: '#eee',
          marginBottom: '24px',
          lineHeight: 1.5,
          WebkitTextStroke: '0.15vw #720b0bff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1vw'
        }}>
          <span>- Clique <span style={{ color: '#ffb224ff', fontSize: '2.3vw' }}>Fora do Tabuleiro</span> quando terminar</span>
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
        <div style={{
          fontSize: '2vw',
          color: '#eee',
          marginBottom: '24px',
          lineHeight: 1.5,
          WebkitTextStroke: '0.15vw #720b0bff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1vw'
        }}>
          <span>- Este é seu <span style={{ color: '#ffb224ff', fontSize: '2.3vw' }}>tempo total</span></span>
          <span>- Tente ser <span style={{ color: '#ffb224ff', fontSize: '2.3vw' }}>rápido!</span></span>
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
        <div style={{
          fontSize: '2vw',
          color: '#eee',
          marginBottom: '24px',
          lineHeight: 1.5,
          WebkitTextStroke: '0.15vw #720b0bff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1vw'
        }}>
          <span>- Acerte todas as rodadas para ganhar <span style={{ color: '#ffb224ff', fontSize: '2.3vw' }}>3 estrelas</span></span>
        </div>
      )
    }
  ];

  // Load level config on mount
  useEffect(() => {
    if (levelId) {
      const level = getLevelById(parseInt(levelId));
      if (level) {
        setLevelConfig(level);
      } else {
        // Level not found, redirect back
        navigate('/cacaSomaNiveis');
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

  // Handle time updates from timer
  const onTimeUpdate = useCallback((tempo: number) => {
    setLiveTime(tempo);
  }, []);

  // Handle round submission
  const noOp = useCallback(() => { }, []);

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

    // Move to next round or finish
    if (levelConfig && currentRound < levelConfig.rounds) {
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
  }, [currentRound, sorteado, soma, roundResults, totalTime, selectedNumbers]);

  const finishLevel = (results: RoundResult[], finalTime: number) => {
    if (!levelConfig) return;

    const correctCount = results.filter(r => r.correct).length;
    const stars = calculateStars(correctCount, finalTime, levelConfig.levelId);
    setStarsEarned(stars);

    // Save progress immediately
    updateLevelProgress({
      levelId: levelConfig.levelId,
      rounds: results,
      totalCorrect: correctCount,
      totalTime: finalTime,
      starsEarned: stars,
      passed: stars >= 2
    });

    setShowResultModal(true);
  };

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
    // Reset board and used numbers
    setGameKey(prev => prev + 1);
    setUsedIndices(new Set());
  };

  const handleNextLevel = () => {
    if (levelConfig && levelConfig.levelId < getTotalLevels()) {
      const nextId = levelConfig.levelId + 1;
      navigate(`/cacaSomaNivel/${nextId}`);
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
      // Reset board and used numbers
      setGameKey(prev => prev + 1);
      setUsedIndices(new Set());
    }
  };

  const handleMenu = () => {
    navigate('/cacaSomaNiveis');
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

          <div data-target="step1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
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
      {showTutorial && (
        <DynamicTutorial
          steps={tutorialSteps}
          onFinish={() => setShowTutorial(false)}
          storageKey="cacasoma_levels_v1"
          locale="pt"
        />
      )}
    </div>
  );
}

export default LevelGamePage;
