import styles from "./Winner.module.css";
import { Piece } from "./Piece";

export function WinnerOverlay({
  winner,
  onRestart,
  isAiMode = false,
}: {
  winner: "X" | "O" | "tie";
  onRestart: () => void;
  isAiMode?: boolean;
}) {
  let titleText = "Ganhador:";
  if (winner === "tie") {
    titleText = "Empate!";
  } else if (isAiMode) {
    // In AI mode, X is Human, O is AI
    if (winner === "X") {
      titleText = "Você Venceu!";
    } else {
      titleText = "O Bot Venceu!";
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
        <button onClick={onRestart}>Jogar de novo</button>
      </div>
    </div>
  );
}
