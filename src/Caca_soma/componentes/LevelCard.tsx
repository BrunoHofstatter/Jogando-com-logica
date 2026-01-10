import React from 'react';
import { LevelConfig, LevelProgress } from '../Logic/gameTypes';
import StarDisplay from './StarDisplay';
import styles from '../styles/levelCard.module.css';

interface LevelCardProps {
  level: LevelConfig;
  progress: LevelProgress;
  isLocked: boolean;
  onSelect: (levelId: number) => void;
}

function LevelCard({ level, progress, isLocked, onSelect }: LevelCardProps) {
  const handleClick = () => {
    if (!isLocked) {
      onSelect(level.levelId);
    }
  };

  return (
    <div
      className={`${styles.card} ${isLocked ? styles.cardLocked : ''}`}
      onClick={handleClick}
    >
      {/* Lock icon */}
      {isLocked && (
        <div className={styles.lockIcon}>
          🔒
        </div>
      )}

      {/* Level number */}
      <div className={styles.levelNumber}>
        Nível {level.levelId}
      </div>

      {/* Description */}
      <div className={styles.description}>
        {level.description}
      </div>

      {/* Stars */}
      {!isLocked && (
        <div className={styles.starsContainer}>
          <StarDisplay stars={progress.bestStars} size="medium" showNumbers />
        </div>
      )}

      {/* Best time */}
      {!isLocked && progress.bestStars > 0 && progress.bestTime !== Infinity && (
        <div className={styles.bestTime}>
          Melhor tempo: {progress.bestTime.toFixed(1)}s
        </div>
      )}

      {/* Completion status */}
      {!isLocked && progress.completed && (
        <div className={styles.completed}>
          ✓ Concluído
        </div>
      )}
    </div>
  );
}

export default LevelCard;
