import React from "react";

import type { CrownChaseEndReason, PlayerId } from "../Logic/v2";
import styles from "../styles/victoryScreen.module.css";

interface VictoryScreenProps {
  winner: PlayerId | null;
  endReason: CrownChaseEndReason | null;
  onPlayAgain: () => void;
  onPlayAgainDisabled?: boolean;
  playAgainLabel?: string;
  onMenu?: () => void;
  onNextLevel?: () => void;
  showNextLevel?: boolean;
  isAIMode?: boolean;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winner,
  endReason,
  onPlayAgain,
  onPlayAgainDisabled = false,
  playAgainLabel = "Jogar Novamente",
  onMenu,
  onNextLevel,
  showNextLevel,
  isAIMode = false,
}) => {
  const isDraw = winner === null;
  const userWon = isAIMode && winner === 1;
  const playerClass = winner === 0 ? styles.playerRed : styles.playerBlue;
  const opponentClass = winner === 0 ? styles.playerBlueOp : styles.playerRedOp;

  return (
    <div className={styles.gamePage}>
      <div className={styles.victorySidebar}>
        <div className={styles.victoryContent}>
          <h2 className={styles.victoryTitle}>
            {isDraw ? "Empate!" : isAIMode ? (userWon ? "Vitória!" : "Derrota!") : "Vitória!"}
          </h2>

          <div className={styles.victoryMessage}>
            {isDraw ? (
              <p className={styles.victoryReason}>
                {endReason === "double_stuck"
                  ? "Nenhum jogador tinha movimentos disponíveis."
                  : "A partida terminou em empate!"}
              </p>
            ) : isAIMode ? (
              <>
                <p className={styles.victoryWinner}>
                  {userWon ? "Você ganhou do computador!" : "Você perdeu para o computador!"}
                </p>
                <p className={styles.victoryReason}>
                  {userWon ? "Você capturou o Rei inimigo!" : "Seu Rei foi capturado!"}
                </p>
              </>
            ) : (
              <>
                <p className={styles.victoryWinner}>
                  O Jogador <span className={playerClass}>●</span> venceu a partida!
                </p>
                <p className={styles.victoryReason}>
                  O Rei <span className={opponentClass}>●</span> foi capturado.
                </p>
              </>
            )}
          </div>

          <div className={styles.victoryButtonsContainer}>
            <div className={styles.victoryButtonsRow}>
              {onMenu && (
                <button onClick={onMenu} className={styles.victoryButtonMenu}>
                  Menu
                </button>
              )}
              <button
                onClick={onPlayAgain}
                className={styles.victoryButton}
                disabled={onPlayAgainDisabled}
              >
                {playAgainLabel}
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
