import React from 'react';
import styles from '../styles/victoryScreen.module.css';

interface VictoryScreenProps {
  winner: number;
  reason: string;
  onPlayAgain: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ 
  winner, 
  reason, 
  onPlayAgain 
}) => {
  const playerColor = winner === 0 ? 'Vermelho' : winner === 1 ? 'Azul' : '';
  const playerClass = winner === 0 ? styles.playerRed : winner === 1 ? styles.playerBlue : '';
  const OpplayerClass = winner === 0 ? styles.playerBlueOp : winner === 1 ? styles.playerRedOp : '';
  
  return (
    <div className={styles.gamePage}>
    <div className={styles.victorySidebar}>
      <div className={styles.victoryContent}>
        <h2 className={styles.victoryTitle}>
          {winner === -1 ? 'Empate!' : 'Vitória!'}
        </h2>
        <div className={styles.victoryMessage}>
          {winner !== -1 ? (
            <>
            <p className={styles.victoryWinner}>
                O Jogador <span className={playerClass}>●</span> venceu a partida!
              </p>
              <p className={styles.victoryReason}>
                <span className={playerClass}></span> O capitão <span className={OpplayerClass}>●</span> foi capturado
              </p>
              
              
            </>
          ) : (
            <p className={styles.victoryReason}>A partida terminou em empate!</p>
          )}
        </div>
        <button 
          onClick={onPlayAgain}
          className={styles.victoryButton}
        >
          Jogar Novamente
        </button>
      </div>
    </div>
    </div>
  );
};