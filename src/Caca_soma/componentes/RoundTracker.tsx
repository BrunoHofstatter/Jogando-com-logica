import React from 'react';
import styles from './roundTracker.module.css';

interface RoundTrackerProps {
  currentRound: number;
  totalRounds: number;
  levelId: number;
}

function RoundTracker({ currentRound, totalRounds, levelId }: RoundTrackerProps) {
  const progressPercent = (currentRound / totalRounds) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.roundText}>
        Nível {levelId} - Rodada {currentRound}/{totalRounds}
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>

      <div className={styles.dotsRow}>
        {Array.from({ length: totalRounds }).map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${
              index < currentRound ? styles.dotCompleted : styles.dotPending
            } ${index === currentRound - 1 ? styles.dotActive : ''}`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoundTracker;
