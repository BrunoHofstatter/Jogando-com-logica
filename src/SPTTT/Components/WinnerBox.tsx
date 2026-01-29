import styles from "../Style/Winner.module.css";
import { Piece } from "./Piece";

export function WinnerOverlay({
  winner,
  onRestart,
  isAiMode = false,
  onMenu,
  onNextLevel,
  showNextLevel,
}: {
  winner: "X" | "O" | "tie";
  onRestart: () => void;
  isAiMode?: boolean;
  onMenu?: () => void;
  onNextLevel?: () => void;
  showNextLevel?: boolean;
}) {
  let titleText = "Ganhador:";
  if (winner === "tie") {
    titleText = "Empate!";
  } else if (isAiMode) {
    // In AI mode, X is Human, O is AI
    if (winner === "X") {
      titleText = "Você Venceu!";
    } else {
      titleText = "O computador Venceu!";
    }
  }

  return (
    <div className={styles["winner-overlay"]}>
      <div className={styles["winner-box"]}>
        {winner === "tie" ? (
          <h2>{titleText}</h2>
        ) : (
          <>
            <h2>{titleText}</h2>
            {!isAiMode && <Piece player={winner} />}
          </>
        )}

        <div className={styles.victoryButtonsContainer}>
          <div className={styles.victoryButtonsRow}>
            {isAiMode && onMenu && (
              <button onClick={onMenu} className={styles.victoryButtonMenu}>
                Menu
              </button>
            )}
            <button onClick={onRestart}>Jogar de novo</button>
          </div>

          {showNextLevel && onNextLevel && (
            <button onClick={onNextLevel} className={styles.victoryButtonNext}>
              Próxima dificuldade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
