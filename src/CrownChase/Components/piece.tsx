import React from "react";

import type { CrownChasePiece, PieceType } from "../Logic/v2";
import styles from "../styles/piece.module.css";

const PIECE_SYMBOLS: Record<PieceType, string> = {
  king: "crownchaseKingSymbol.png",
  killer: "crownchaseAssassinSymbol.png",
  jumper: "crownchaseJumperSymbol.png",
};

interface PieceProps {
  piece: CrownChasePiece;
  isSelected: boolean;
  onPieceClick: () => void;
}

interface PieceVisualProps {
  piece: CrownChasePiece;
  isSelected?: boolean;
  fillContainer?: boolean;
  onPieceClick?: () => void;
}

export const CrownChasePieceVisual: React.FC<PieceVisualProps> = ({
  piece,
  isSelected = false,
  fillContainer = false,
  onPieceClick,
}) => {
  const symbolSrc = `${import.meta.env.BASE_URL}${PIECE_SYMBOLS[piece.type]}`;

  return (
    <div
      className={`${styles.piece} ${piece.owner === 0 ? styles.pieceRed : styles.pieceBlue} ${styles[piece.type]} ${
        isSelected ? styles.pieceSelected : ""
      } ${fillContainer ? styles.pieceFillContainer : ""}`}
      style={{
        width: fillContainer ? "100%" : "75%",
        height: fillContainer ? "100%" : "75%",
        background: getPlayerColor(piece.owner),
      }}
      onClick={
        onPieceClick
          ? (event) => {
              event.stopPropagation();
              onPieceClick();
            }
          : undefined
      }
    >
      <img
        src={symbolSrc}
        className={styles.pieceSymbol}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </div>
  );
};

const PieceComponent: React.FC<PieceProps> = ({
  piece,
  isSelected,
  onPieceClick,
}) => (
  <CrownChasePieceVisual
    piece={piece}
    isSelected={isSelected}
    onPieceClick={onPieceClick}
  />
);

function getPlayerColor(owner: number): string {
  return owner === 0
    ? "radial-gradient(circle, #e74c3c, #c0392b)"
    : "radial-gradient(circle, #5dade2, #2980b9)";
}

export default PieceComponent;
