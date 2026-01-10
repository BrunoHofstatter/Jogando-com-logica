import styles from "../Style/SPTTT.module.css";
import { CircleSmall, X } from "lucide-react";


interface PieceProps {
  player: "X" | "O";
}

export function Piece({ player }: PieceProps) {
  return (
    <div className={`${styles.symbol} ${player === "X" ? styles["x-symbol"] : styles["o-symbol"]}`}>
      {player === "X" ? (
        <div className={styles.Xstack}>
          <X className={styles.Xin} />
          <X className={styles.Xout} />
        </div>
      ) : (
        <div className={styles.Ostack}>
          <CircleSmall className={styles.Oin} />
          <CircleSmall className={styles.Oout} />
        </div>
      )}
    </div>
  );
}