import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import {
  applyAction,
  createInitialState,
  getLegalActionsForPiece,
  resolveMoveIntent,
} from "../Logic/v2";
import type {
  CrownChaseAction,
  CrownChaseState,
  MoveIntent,
  PlayerId,
  Position,
} from "../Logic/v2";
import PieceComponent from "./piece";
import styles from "../styles/board.module.css";
import { VictoryScreen } from "./VictoryScreen";

interface BoardProps {
  mode?: "local" | "remote";
  gameState?: CrownChaseState;
  onGameStateChange?: (newState: CrownChaseState) => void;
  onMoveIntent?: (intent: MoveIntent) => void;
  playerSeat?: PlayerId;
  interactionLocked?: boolean;
  onPlayAgain?: () => void;
  onPlayAgainDisabled?: boolean;
  playAgainLabel?: string;
  statusMessage?: string | null;
  isAIMode?: boolean;
  difficulty?: number;
  onMenu?: () => void;
  onNextLevel?: () => void;
  showNextLevel?: boolean;
}

const Board: React.FC<BoardProps> = ({
  mode = "local",
  gameState: externalGameState,
  onGameStateChange,
  onMoveIntent,
  playerSeat,
  interactionLocked = false,
  onPlayAgain,
  onPlayAgainDisabled = false,
  playAgainLabel,
  statusMessage,
  isAIMode = false,
  difficulty,
  onMenu,
  onNextLevel,
  showNextLevel,
}) => {
  const [internalGameState, setInternalGameState] = useState<CrownChaseState>(() =>
    createInitialState(),
  );
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const gameState = externalGameState ?? internalGameState;
  const selectedPiece = selectedSquare
    ? gameState.board[selectedSquare.row]?.[selectedSquare.col] ?? null
    : null;
  const availableActions =
    selectedSquare &&
    selectedPiece &&
    selectedPiece.owner === gameState.currentPlayer &&
    gameState.status === "playing"
      ? getLegalActionsForPiece(gameState, selectedSquare)
      : [];
  const highlightedSquares = availableActions.map((action) => action.to);
  const finalWin =
    gameState.status === "ended"
      ? {
          winner: gameState.winner,
          endReason: gameState.endReason,
        }
      : null;
  const turnLabel = statusMessage ?? (
    mode === "remote" && playerSeat !== undefined
      ? gameState.currentPlayer === playerSeat
        ? "Sua vez"
        : "Vez do oponente"
      : isAIMode
        ? gameState.currentPlayer === 0
          ? "Vez do computador"
          : "Sua vez"
        : "Vez do Jogador"
  );
  const interactionBlocked =
    gameState.status === "ended" ||
    (mode === "remote"
      ? interactionLocked ||
        playerSeat === undefined ||
        gameState.currentPlayer !== playerSeat
      : isAIMode && gameState.currentPlayer === 0);

  useEffect(() => {
    setSelectedSquare(null);
  }, [gameState]);

  const updateGameState = (newState: CrownChaseState) => {
    if (onGameStateChange) {
      onGameStateChange(newState);
      return;
    }

    setInternalGameState(newState);
  };

  const handlePlayAgain = () => {
    if (mode === "remote" && onPlayAgain) {
      onPlayAgain();
      return;
    }

    updateGameState(createInitialState());
  };

  const handleSquareClick = (row: number, col: number) => {
    const clickedPosition = { row, col };
    const clickedPiece = gameState.board[row][col];

    if (interactionBlocked) {
      return;
    }

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        return;
      }

      const action =
        resolveMoveIntent(gameState, {
          from: selectedSquare,
          to: clickedPosition,
        }) ??
        availableActions.find(
          (candidate) =>
            candidate.to.row === row && candidate.to.col === col,
        ) ??
        null;

      if (action) {
        commitAction(action);
        return;
      }

      if (clickedPiece?.owner === gameState.currentPlayer) {
        setSelectedSquare(clickedPosition);
        return;
      }

      setSelectedSquare(null);
      return;
    }

    if (clickedPiece?.owner === gameState.currentPlayer) {
      setSelectedSquare(clickedPosition);
    }
  };

  const commitAction = (action: CrownChaseAction) => {
    if (mode === "remote") {
      onMoveIntent?.({
        from: action.from,
        to: action.to,
      });
      setSelectedSquare(null);
      return;
    }

    const result = applyAction(gameState, action);
    if (!result.ok) {
      return;
    }

    updateGameState(result.state);
    setSelectedSquare(null);
  };

  const isSquareSelected = (row: number, col: number): boolean =>
    selectedSquare !== null &&
    selectedSquare.row === row &&
    selectedSquare.col === col;

  const isSquareHighlighted = (row: number, col: number): boolean =>
    highlightedSquares.some((position) => position.row === row && position.col === col);

  const getPieceLabel = (pieceType: string): string => {
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
  };

  return (
    <div className={styles.gamePage}>
      <div className={styles.gameContainer}>
        <div className={styles.gameInfo} data-target="gameInfo">
          {isAIMode && difficulty && (
            <div className={styles.difficultyBox}>
              Nível: {difficulty === 1 ? "Muito Fácil" : difficulty === 2 ? "Fácil" : difficulty === 3 ? "Médio" : "Difícil"}
            </div>
          )}

          <div className={styles.currentPlayer}>
            {turnLabel}
            <span
              className={`${styles.playerIndicator} ${gameState.currentPlayer === 0 ? styles.playerRed : styles.playerBlue}`}
            >
              ●
            </span>
          </div>

          <div className={styles.capturesSection}>
            <div className={styles.captureInfo}>
              <span className={styles.captureText}>
                Peças <span className={styles.redIndicator}>●</span> capturadas: {gameState.capturedByPlayer[0]}
              </span>
            </div>
            <div className={styles.captureInfo}>
              <span className={styles.captureText}>
                Peças <span className={styles.blueIndicator}>●</span> capturadas: {gameState.capturedByPlayer[1]}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.boardWrapper}>
          <div
            className={styles.board}
            style={
              {
                "--board-cols": gameState.board[0]?.length ?? 0,
                "--board-rows": gameState.board.length,
              } as CSSProperties
            }
          >
            {gameState.board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isSelected = isSquareSelected(rowIndex, colIndex);
                const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
                const squareType =
                  (rowIndex + colIndex) % 2 === 0 ? styles.lightSquare : styles.darkSquare;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    data-square={`${String.fromCharCode(97 + colIndex)}${rowIndex + 1}`}
                    data-piece={piece ? `${piece.owner === 0 ? "red" : "blue"}-${piece.type}` : undefined}
                    className={`${styles.square} ${squareType} ${isHighlighted ? styles.squareHighlighted : ""}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {piece && (
                      <PieceComponent
                        piece={piece}
                        isSelected={isSelected}
                        onPieceClick={() => handleSquareClick(rowIndex, colIndex)}
                      />
                    )}

                    {isHighlighted && !piece && <div className={styles.moveIndicator} />}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {selectedSquare && selectedPiece && (
          <div className={styles.pieceInfo}>
            <h4>Peça Selecionada</h4>
            <p>Tipo: {getPieceLabel(selectedPiece.type)}</p>
            <p>Posição: ({selectedSquare.row + 1}, {selectedSquare.col + 1})</p>
            <p>Ações disponíveis: {availableActions.length}</p>
          </div>
        )}

        {finalWin && (
          <VictoryScreen
            winner={finalWin.winner}
            endReason={finalWin.endReason}
            onPlayAgain={handlePlayAgain}
            onPlayAgainDisabled={onPlayAgainDisabled}
            playAgainLabel={playAgainLabel}
            isAIMode={isAIMode}
            onMenu={onMenu}
            onNextLevel={onNextLevel}
            showNextLevel={showNextLevel}
          />
        )}
      </div>
    </div>
  );
};

export default Board;
