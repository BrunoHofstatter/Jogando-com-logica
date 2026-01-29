import React from 'react';
import styles from '../styles/victoryScreen.module.css';

interface VictoryScreenProps {
  winner: number;
  reason: string;
  onPlayAgain: () => void;
  onMenu?: () => void;
  onNextLevel?: () => void;
  showNextLevel?: boolean;
  isAIMode?: boolean;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winner,
  reason,
  onPlayAgain,
  onMenu,
  onNextLevel,
  showNextLevel,
  isAIMode = false
}) => {
  const playerColor = winner === 0 ? 'Vermelho' : winner === 1 ? 'Azul' : '';
  const playerClass = winner === 0 ? styles.playerRed : winner === 1 ? styles.playerBlue : '';
  const OpplayerClass = winner === 0 ? styles.playerBlueOp : winner === 1 ? styles.playerRedOp : '';

  // AI mode: player 1 (blue) is the user, player 0 (red) is the AI
  const userWon = isAIMode && winner === 1;
  const userLost = isAIMode && winner === 0;

  return (
    <div className={styles.gamePage}>
      <div className={styles.victorySidebar}>
        <div className={styles.victoryContent}>
          <h2 className={styles.victoryTitle}>
            {winner === -1 ? 'Empate!' : (isAIMode ? (userWon ? 'Vitória!' : 'Derrota!') : 'Vitória!')}
          </h2>
          <div className={styles.victoryMessage}>
            {winner !== -1 ? (
              <>
                {isAIMode ? (
                  <>
                    <p className={styles.victoryWinner}>
                      {userWon ? 'Você ganhou do computador!' : 'Você perdeu para o computador!'}
                    </p>
                    <p className={styles.victoryReason}>
                      {userWon ? 'Você capturou o Rei!' : 'Seu Rei foi capturado!'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className={styles.victoryWinner}>
                      O Jogador <span className={playerClass}>●</span> venceu a partida!
                    </p>
                    <p className={styles.victoryReason}>
                      <span className={playerClass}></span> O rei <span className={OpplayerClass}>●</span> foi capturado
                    </p>
                  </>
                )}
              </>
            ) : (
              <p className={styles.victoryReason}>A partida terminou em empate!</p>
            )}
          </div>
          <div className={styles.victoryButtonsContainer}>
            <div className={styles.victoryButtonsRow}>
              <button onClick={onMenu} className={styles.victoryButtonMenu}>
                Menu
              </button>
              <button
                onClick={onPlayAgain}
                className={styles.victoryButton}
              >
                Jogar Novamente
              </button>
            </div>

            {showNextLevel && onNextLevel && (
              <button onClick={onNextLevel} className={styles.victoryButtonNext}>
                Próxima dificuldade
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};