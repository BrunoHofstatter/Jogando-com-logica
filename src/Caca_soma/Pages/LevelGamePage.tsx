import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLevelById } from '../Logic/levelConfigs';
import { calculateStars } from '../Logic/levelProgress';
import { LevelConfig, RoundResult } from '../Logic/gameTypes';
import Tabuleiro from '../componentes/tabuleiro';
import Girar from '../componentes/sorteio';
import GameButton from '../componentes/GameButton';
import RoundTracker from '../componentes/RoundTracker';
import styles from '../styles/design.module.css';

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
        {/* Round tracker */}
        <RoundTracker currentRound={currentRound} totalRounds={10} />

        {/* Magic number display */}
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          padding: '1rem',
          fontFamily: '"Cherry Bomb One", cursive',
          WebkitTextStroke: '1px #b71c1c',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
        }}>
          <Girar
            mudarJogar={mudarJogar}
            clicar={clicar}
            mudarSorteado={mudarSorteado}
            rodada={currentRound}
            customRange={getCurrentRange()}
          />
        </div>

        {/* Game button */}
        <GameButton
          jogar={jogar}
          clicar={clicar}
          mudarClicar={mudarClicar}
          onSubmit={okayFunction}
        />

        {/* Current selection sum */}
        <div style={{
          fontSize: '1.5rem',
          color: '#fff',
          textAlign: 'center',
          marginTop: '1rem',
          fontFamily: '"Cherry Bomb One", cursive'
        }}>
          Soma atual: {soma}
        </div>

        {/* Live time display */}
        <div style={{
          fontSize: '1.2rem',
          color: '#fff',
          textAlign: 'center',
          marginTop: '0.5rem',
          fontFamily: '"Cherry Bomb One", cursive'
        }}>
          Tempo: {liveTime.toFixed(1)}s
        </div>

        {/* Total time display */}
        <div style={{
          fontSize: '1rem',
          color: '#aaa',
          textAlign: 'center',
          marginTop: '0.5rem',
          fontFamily: '"Cherry Bomb One", cursive'
        }}>
          Tempo total: {totalTime.toFixed(1)}s
        </div>
      </div>

      {/* Game board */}
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
      />
    </div>
  );
}

export default LevelGamePage;
