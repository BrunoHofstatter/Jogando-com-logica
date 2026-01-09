import React from 'react';
import { LevelConfig, LevelProgress } from '../Logic/gameTypes';
import StarDisplay from './StarDisplay';

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
      onClick={handleClick}
      style={{
        position: 'relative',
        padding: '1.5rem',
        background: isLocked
          ? 'linear-gradient(135deg, #555 0%, #333 100%)'
          : 'linear-gradient(135deg, #b71c1c 0%, #961212 100%)',
        border: '3px solid #000',
        borderRadius: '1rem',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.6 : 1,
        filter: isLocked ? 'grayscale(100%)' : 'none',
        transition: 'all 0.3s ease',
        boxShadow: isLocked
          ? '0 4px 8px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(183, 28, 28, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        minHeight: '180px',
        ':hover': {
          transform: isLocked ? 'none' : 'translateY(-5px)',
          boxShadow: isLocked
            ? '0 4px 8px rgba(0,0,0,0.3)'
            : '0 8px 20px rgba(183, 28, 28, 0.7)'
        }
      }}
      onMouseEnter={(e) => {
        if (!isLocked) {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(183, 28, 28, 0.7)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isLocked
          ? '0 4px 8px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(183, 28, 28, 0.5)';
      }}
    >
      {/* Lock icon */}
      {isLocked && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          fontSize: '2rem',
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          🔒
        </div>
      )}

      {/* Level number */}
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
        fontFamily: '"Cherry Bomb One", cursive',
        WebkitTextStroke: '1px #000'
      }}>
        Nível {level.levelId}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '0.9rem',
        color: '#fff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
        fontFamily: '"Cherry Bomb One", cursive',
        minHeight: '2.5rem'
      }}>
        {level.description}
      </div>

      {/* Stars */}
      {!isLocked && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 'auto'
        }}>
          <StarDisplay stars={progress.bestStars} size="medium" showNumbers />
        </div>
      )}

      {/* Best time */}
      {!isLocked && progress.bestStars > 0 && progress.bestTime !== Infinity && (
        <div style={{
          fontSize: '0.8rem',
          color: '#fff',
          textAlign: 'center',
          textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
          fontFamily: '"Cherry Bomb One", cursive'
        }}>
          Melhor tempo: {progress.bestTime.toFixed(1)}s
        </div>
      )}

      {/* Completion status */}
      {!isLocked && progress.completed && (
        <div style={{
          fontSize: '0.8rem',
          color: '#4caf50',
          textAlign: 'center',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
          fontFamily: '"Cherry Bomb One", cursive'
        }}>
          ✓ Concluído
        </div>
      )}
    </div>
  );
}

export default LevelCard;
