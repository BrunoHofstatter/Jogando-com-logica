import React from "react";

import type { MathWarPiece } from "../Logic/v2";
import styles from "../styles/piece.module.css";

interface PieceProps {
  piece: MathWarPiece;
  isSelected: boolean;
  onPieceClick: () => void;
}

const PieceComponent: React.FC<PieceProps> = ({
  piece,
  isSelected,
  onPieceClick,
}) => {
  const getPlayerColor = (owner: number, isCaptain: boolean = false) => {
    const colors = [
      "radial-gradient(circle, #e74c3c, #c0392b)",
      "radial-gradient(circle, #5dade2, #2980b9)",
      "#2ecc71",
      "#f39c12",
      "#9b59b6",
      "#e67e22",
    ];
    const baseColor = colors[owner % colors.length];

    if (isCaptain) {
      if (owner === 0) {
        return "radial-gradient(circle,rgb(231, 117, 60),rgb(192, 100, 43))";
      }

      if (owner === 1) {
        return "radial-gradient(circle,rgb(159, 129, 230),rgb(149, 82, 203))";
      }
    }

    return baseColor;
  };

  const display = {
    symbol: `+${piece.value}`,
    backgroundColor: getPlayerColor(piece.owner, piece.isCaptain),
    textColor: "white",
    shape: piece.type === "sumDiag" ? "square" : "circle",
  };

  const pieceTitle = piece.isCaptain
    ? `${piece.type === "sumDiag" ? "Soma quadrada" : "Soma redonda"} - Capitão`
    : piece.type === "sumDiag"
      ? "Soma quadrada"
      : "Soma redonda";

  return (
    <div
      className={`${styles.piece} ${piece.owner === 0 ? styles.pieceRed : styles.pieceBlue} ${styles[piece.type] || ""} ${display.shape === "square" ? styles.pieceSquare : styles.pieceCircle} ${isSelected ? styles.pieceSelected : ""}`}
      style={{
        width: display.shape === "square" ? "70%" : "75%",
        height: display.shape === "square" ? "70%" : "75%",
        background: display.backgroundColor,
        fontSize: "12px",
        color: display.textColor,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onPieceClick();
      }}
      title={pieceTitle}
    >
      <div className={styles.pieceContent}>
        <div className={styles.pieceValueText}>
          {display.symbol}
        </div>
      </div>

      {piece.isCaptain && (
        <div className={styles.pieceCaptainIndicator}>C</div>
      )}
    </div>
  );
};

export default PieceComponent;
