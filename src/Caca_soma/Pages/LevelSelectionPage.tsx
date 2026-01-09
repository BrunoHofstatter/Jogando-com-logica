import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { levels } from '../Logic/levelConfigs';
import { getAllProgress, isLevelUnlocked } from '../Logic/levelProgress';
import { LevelProgress } from '../Logic/gameTypes';
import LevelCard from '../componentes/LevelCard';
import styles from '../styles/levelSelection.module.css';

function LevelSelectionPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<LevelProgress[]>([]);

  useEffect(() => {
    // Load progress from localStorage
    const allProgress = getAllProgress();
    setProgress(allProgress);
  }, []);

  const handleLevelSelect = (levelId: number) => {
    navigate(`/cacaSomaNivel/${levelId}`);
  };

  const completedLevels = progress.filter(p => p.completed).length;

  return (
    <div className={styles.selectionContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Caça Soma - Níveis</h1>
        <p className={styles.subtitle}>
          {completedLevels}/{levels.length} níveis completados
        </p>
      </div>

      {/* Level grid */}
      <div className={styles.levelGrid}>
        {levels.map((level) => {
          const levelProgress = progress.find(p => p.levelId === level.levelId) || {
            levelId: level.levelId,
            completed: false,
            bestStars: 0,
            bestTime: Infinity,
            bestCorrect: 0,
            attempts: 0,
            lastPlayed: ''
          };

          const locked = !isLevelUnlocked(level.levelId);

          return (
            <LevelCard
              key={level.levelId}
              level={level}
              progress={levelProgress}
              isLocked={locked}
              onSelect={handleLevelSelect}
            />
          );
        })}
      </div>

      {/* Back button */}
      <button
        className={styles.backButton}
        onClick={() => navigate('/cacasomaRg')}
      >
        Voltar
      </button>
    </div>
  );
}

export default LevelSelectionPage;
