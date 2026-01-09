import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateLevelProgress, isLevelUnlocked } from '../Logic/levelProgress';
import { getTotalLevels } from '../Logic/levelConfigs';
import StarDisplay from '../componentes/StarDisplay';
import styles from '../styles/results.module.css';

interface ResultsState {
  levelId: number;
  rounds: Array<{
    roundNumber: number;
    magicNumber: number;
    selectedNumbers: number[];
    sum: number;
    correct: boolean;
    timeTaken: number;
  }>;
  totalCorrect: number;
  totalTime: number;
  starsEarned: number;
  passed: boolean;
}

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState;

  const [showDetails, setShowDetails] = useState(false);
  const [nextLevelUnlocked, setNextLevelUnlocked] = useState(false);

  useEffect(() => {
    if (!state) {
      // No state, redirect to level selection
      navigate('/cacaSomaNiveis');
      return;
    }

    // Update progress in localStorage
    updateLevelProgress({
      levelId: state.levelId,
      rounds: state.rounds,
      totalCorrect: state.totalCorrect,
      totalTime: state.totalTime,
      starsEarned: state.starsEarned,
      passed: state.passed
    });

    // Check if next level is unlocked
    const nextLevelId = state.levelId + 1;
    if (nextLevelId <= getTotalLevels()) {
      setNextLevelUnlocked(isLevelUnlocked(nextLevelId));
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const handleNextLevel = () => {
    const nextLevelId = state.levelId + 1;
    if (nextLevelId <= getTotalLevels()) {
      navigate(`/cacaSomaNivel/${nextLevelId}`);
    }
  };

  const handleRetry = () => {
    navigate(`/cacaSomaNivel/${state.levelId}`);
  };

  const handleBackToLevels = () => {
    navigate('/cacaSomaNiveis');
  };

  return (
    <div className={styles.resultsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Nível {state.levelId} Completo!</h1>
        {state.passed ? (
          <p className={styles.passedText}>Parabéns! Você passou de nível!</p>
        ) : (
          <p className={styles.failedText}>Você precisa de pelo menos 2 estrelas para passar</p>
        )}
      </div>

      {/* Stars display */}
      <div className={styles.starsSection}>
        <StarDisplay stars={state.starsEarned} size="large" showNumbers />
      </div>

      {/* Statistics */}
      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Acertos</div>
          <div className={styles.statValue}>{state.totalCorrect}/10</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tempo Total</div>
          <div className={styles.statValue}>{state.totalTime.toFixed(1)}s</div>
        </div>
      </div>

      {/* Round breakdown toggle */}
      <button
        className={styles.detailsButton}
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? '▲ Ocultar Detalhes' : '▼ Ver Detalhes das Rodadas'}
      </button>

      {/* Round breakdown */}
      {showDetails && (
        <div className={styles.roundBreakdown}>
          {state.rounds.map((round) => (
            <div
              key={round.roundNumber}
              className={`${styles.roundCard} ${round.correct ? styles.roundCorrect : styles.roundIncorrect}`}
            >
              <div className={styles.roundHeader}>
                <span className={styles.roundNumber}>Rodada {round.roundNumber}</span>
                <span className={styles.roundStatus}>
                  {round.correct ? '✓ Correto' : '✗ Incorreto'}
                </span>
              </div>
              <div className={styles.roundDetails}>
                <div>Número Mágico: {round.magicNumber}</div>
                <div>Sua Soma: {round.sum}</div>
                <div>Tempo: {round.timeTaken.toFixed(1)}s</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.buttonSection}>
        {state.passed && state.levelId < getTotalLevels() && (
          <button
            className={`${styles.actionButton} ${styles.nextButton}`}
            onClick={handleNextLevel}
            disabled={!nextLevelUnlocked}
          >
            {nextLevelUnlocked ? 'Próximo Nível' : 'Próximo Nível (Bloqueado)'}
          </button>
        )}

        <button
          className={`${styles.actionButton} ${styles.retryButton}`}
          onClick={handleRetry}
        >
          Tentar Novamente
        </button>

        <button
          className={`${styles.actionButton} ${styles.backButton}`}
          onClick={handleBackToLevels}
        >
          Voltar para Níveis
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;
