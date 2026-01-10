import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLevelById } from '../Logic/levelConfigs';
import { calculateStars } from '../Logic/levelProgress';
import { LevelConfig, RoundResult } from '../Logic/gameTypes';
import Tabuleiro from '../componentes/tabuleiro';
import Girar from '../componentes/sorteio';
import GameButton from '../componentes/GameButton';
import RoundTracker from '../componentes/RoundTracker';
import styles from '../styles/levelGame.module.css';

function LevelGamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [totalTime, setTotalTime] = useState(0);

  // Game state
  const [sorteado, setSorteado] = useState(0);
  const [soma, setSoma] = useState(0);
  const [quantos, setQuantos] = useState(0);
  const [jogar, setJogar] = useState(false);
  const [clicar, setClicar] = useState(true);
  const [liveTime, setLiveTime] = useState(0);
  const [okayFunction, setOkayFunction] = useState<(() => void) | null>(null);
  const [gameOver, setGameOver] = useState(false);

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

  // Toggle functions
  const mudarJogar = () => setJogar(!jogar);
  const mudarClicar = () => setClicar(!clicar);
  const mudarSorteado = (x: number) => setSorteado(x);
  const mudarSoma = (x: number) => setSoma(soma + x);

  // Start Game handler (called by "Começar" button)
  const onStartGame = () => {
    mudarClicar(); // This triggers Girar effect
  };

  // Handle time updates from timer
  const onTimeUpdate = (tempo: number) => {
    setLiveTime(tempo);
  };

  // Handle round submission
  const addTempo = useCallback((tempo: number, currentSoma?: number) => {
    const actualSoma = currentSoma !== undefined ? currentSoma : soma;
    const isCorrect = sorteado === actualSoma;

    // Record round result
    const result: RoundResult = {
      roundNumber: currentRound,
      magicNumber: sorteado,
      selectedNumbers: [], // Could track selected numbers if needed
      sum: actualSoma,
      correct: isCorrect,
      timeTaken: tempo
    };

    setRoundResults(prev => [...prev, result]);
    setTotalTime(prev => prev + tempo);

    // Move to next round or finish
    if (currentRound < 10) {
      setCurrentRound(prev => prev + 1);
      setSorteado(0);
      setSoma(0);
      setQuantos(0);
      setJogar(false);
      setClicar(true);
    } else {
      // Level complete, navigate to results
      setGameOver(true);
      finishLevel([...roundResults, result], totalTime + tempo);
    }
  }, [currentRound, sorteado, soma, roundResults, totalTime]);

  const finishLevel = (results: RoundResult[], finalTime: number) => {
    if (!levelConfig) return;

    const correctCount = results.filter(r => r.correct).length;
    const stars = calculateStars(correctCount, finalTime, levelConfig.levelId);

    navigate('/cacaSomaResultado', {
      state: {
        levelId: levelConfig.levelId,
        rounds: results,
        totalCorrect: correctCount,
        totalTime: finalTime,
        starsEarned: stars,
        passed: stars >= 2
      }
    });
  };

  // Get current round's magic number range
  const getCurrentRange = (): [number, number] | undefined => {
    if (!levelConfig) return undefined;
    return levelConfig.randomNumberRanges[currentRound - 1];
  };

  if (!levelConfig) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        {/* Magic number & Controls */}
        <div className={styles.controlsBox}>
          <RoundTracker currentRound={currentRound} totalRounds={10} />

          <h2 className={styles.magicNumberTitle}>Número Mágico</h2>
          <div className={styles.magicNumberDisplay}>
            <Girar
              mudarJogar={mudarJogar}
              clicar={clicar}
              mudarSorteado={mudarSorteado}
              rodada={currentRound}
              customRange={getCurrentRange()}
            />
          </div>

          <GameButton
            jogar={jogar}
            clicar={clicar}
            gameOver={gameOver}
            onStartGame={onStartGame}
            onSubmit={okayFunction || undefined}
          />
        </div>

        {/* Stats */}
        <div className={styles.statsBox}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Soma atual:</span>
            <span className={styles.statValue}>{soma}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Tempo:</span>
            <span className={styles.statValue}>{liveTime.toFixed(1)}s</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Tempo total:</span>
            <span className={styles.statValue}>{totalTime.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Game board */}
      <div className={styles.rightPanel}>
        <Tabuleiro
          mudarClicar={mudarClicar}
          mudarJogar={mudarJogar}
          mudarRodada={() => {}} // No-op for level mode
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
        />
      </div>
    </div>
  );
}

export default LevelGamePage;
