import React from "react";

import type { CrownChasePiece } from "../Logic/v2";
import styles from "../styles/piece.module.css";

interface PieceProps {
  piece: CrownChasePiece;
  isSelected: boolean;
  onPieceClick: () => void;
}

const PieceComponent: React.FC<PieceProps> = ({
  piece,
  isSelected,
  onPieceClick,
}) => {
  const display = getPieceDisplay(piece);
  const pieceName = getPieceName(piece.type);

  return (
    <div
      className={`${styles.piece} ${piece.owner === 0 ? styles.pieceRed : styles.pieceBlue} ${styles[piece.type] || ""} ${
        display.shape === styles.pieceCircle
      } ${isSelected ? styles.pieceSelected : ""}`}
      style={{
        width: "75%",
        height: "75%",
        background: display.background,
        color: display.textColor,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onPieceClick();
      }}
      title={`${pieceName} (Jogador ${piece.owner + 1})`}
    >
      <div className={styles.pieceContent}>{display.symbol}</div>
      {piece.type === "king" && (
        <div className={styles.pieceKingCrown}>👑</div>
      )}
    </div>
  );
};

function getPieceDisplay(piece: CrownChasePiece) {
  switch (piece.type) {
    case "king":
      return {
        symbol: "●",
        background: getPlayerColor(piece.owner),
        textColor: "#fbbf24",
        shape: "circle" as const,
      };
    case "killer":
      return {
        symbol: "⚔",
        background: getPlayerColor(piece.owner),
        textColor: "#fbbf24",
        shape: "circle" as const,
      };
    case "jumper":
      return {
        symbol: "↑",
        background: getPlayerColor(piece.owner),
        textColor: "#fbbf24",
        shape: "circle" as const,
      };
    default:
      return {
        symbol: "●",
        background: getPlayerColor(piece.owner),
        textColor: "white",
        shape: "circle" as const,
      };
  }
}

function getPlayerColor(owner: number): string {
  return owner === 0
    ? "radial-gradient(circle, #e74c3c, #c0392b)"
    : "radial-gradient(circle, #5dade2, #2980b9)";
}

function getPieceName(pieceType: CrownChasePiece["type"]): string {
  switch (pieceType) {
    case "king":
      return "Rei";
    case "killer":
      return "Assassino";
    case "jumper":
      return "Saltador";
    default:
      return "Peça";
  }
}

export default PieceComponent;
