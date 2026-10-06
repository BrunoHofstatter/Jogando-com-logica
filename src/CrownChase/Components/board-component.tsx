import type { CSSProperties, ReactNode, Ref } from "react";
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
import { toLogicalBoardPosition } from "./boardOrientation";
import PieceComponent from "./piece";
import styles from "../styles/board.module.css";
import { VictoryScreen } from "./VictoryScreen";
import practiceStyles from "../Tutorial/tutorial.module.css";

export interface PracticeBoardAdapter {
  revision: number;
  onAttempt: (intent: MoveIntent) => void;
  onSelection: (position: Position, occupied?: boolean) => void;
  targets: Position[];
  autoSelect: Position | null;
  movement: MoveIntent | null;
  spawned: Position | null;
  frameRef?: Ref<HTMLDivElement>;
  overlay?: ReactNode;
}

interface BoardProps {
  practice?: PracticeBoardAdapter;
  onlineHeader?: ReactNode;
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
  practice,
  onlineHeader,
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
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(practice?.autoSelect ?? null);
  const gameState = externalGameState ?? internalGameState;
  const boardHeight = gameState.board.length;
  const boardWidth = gameState.board[0]?.length ?? 0;
  const isBoardRotated = mode === "remote" && playerSeat === 0;
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
    interactionLocked ||
    gameState.status === "ended" ||
    (mode === "remote"
      ? playerSeat === undefined ||
        gameState.currentPlayer !== playerSeat
      : isAIMode && gameState.currentPlayer === 0);
  const autoRow = practice?.autoSelect?.row;
  const autoCol = practice?.autoSelect?.col;

  useEffect(() => {
    setSelectedSquare(autoRow !== undefined && autoCol !== undefined ? { row: autoRow, col: autoCol } : null);
  }, [gameState, practice?.revision, autoRow, autoCol]);

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

      if (practice) {
        if (clickedPiece?.owner === 1) {
          setSelectedSquare(clickedPosition);
          practice.onSelection(clickedPosition, true);
        } else {
          practice.onAttempt({ from: selectedSquare, to: clickedPosition });
          setSelectedSquare(null);
        }
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

    practice?.onSelection(clickedPosition);
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
        return "Ninja";
      case "jumper":
        return "Saltador";
      default:
        return "Peça";
    }
  };

  return (
    <div className={practice ? practiceStyles.practiceBoard : styles.gamePage}>
      <div className={practice ? practiceStyles.boardContainer : `${styles.gameContainer} ${onlineHeader ? styles.gameContainerOnline : ""}`}>
        {onlineHeader && (
          <div className={styles.onlineHeaderSlot}>{onlineHeader}</div>
        )}
        {!practice && <div className={styles.gameInfo} data-target="gameInfo">
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

          {!practice && <div className={styles.capturesSection}>
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
          </div>}
        </div>}

        <div ref={practice?.frameRef} data-practice-board={practice ? true : undefined} className={`${styles.boardWrapper} ${practice ? practiceStyles.boardFrame : ""}`}>
          <div
            className={`${styles.board} ${practice ? practiceStyles.grid : ""}`}
            style={
              {
                "--board-cols": boardWidth,
                "--board-rows": boardHeight,
              } as CSSProperties
            }
          >
            {Array.from({ length: boardHeight }, (_, displayRowIndex) =>
              Array.from({ length: boardWidth }, (_, displayColIndex) => {
                const { row: rowIndex, col: colIndex } = toLogicalBoardPosition(
                  { row: displayRowIndex, col: displayColIndex },
                  boardHeight,
                  boardWidth,
                  isBoardRotated,
                );
                const piece = gameState.board[rowIndex][colIndex];
                const isSelected = isSquareSelected(rowIndex, colIndex);
                const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
                const squareType =
                  (displayRowIndex + displayColIndex) % 2 === 0
                    ? styles.lightSquare
                    : styles.darkSquare;
                const matches = (p: Position) => p.row === rowIndex && p.col === colIndex;
                const isTarget = practice?.targets.some(matches);
                const arrival = practice?.movement && matches(practice.movement.to) ? practice.movement : null;
                const spawned = practice?.spawned && matches(practice.spawned);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    data-square={`${String.fromCharCode(97 + colIndex)}${rowIndex + 1}`}
                    data-piece={piece ? `${piece.owner === 0 ? "red" : "blue"}-${piece.type}` : undefined}
                    role={practice ? "button" : undefined}
                    tabIndex={practice ? 0 : undefined}
                    aria-disabled={practice ? interactionBlocked : undefined}
                    aria-pressed={practice ? isSelected : undefined}
                    aria-label={practice ? `${piece ? `${getPieceLabel(piece.type)} ${piece.owner === 1 ? "seu, azul" : "do oponente, vermelho"}` : "Casa vazia"}, linha ${rowIndex + 1}, coluna ${colIndex + 1}${isTarget ? ", objetivo marcado" : ""}` : undefined}
                    onKeyDown={practice ? event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (!event.repeat) handleSquareClick(rowIndex, colIndex);
                      }
                    } : undefined}
                    className={`${styles.square} ${squareType} ${isHighlighted ? styles.squareHighlighted : ""} ${practice ? practiceStyles.cell : ""} ${isTarget && isHighlighted ? practiceStyles.target : ""}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {piece && <div key={arrival ? `${practice?.revision}-${arrival.from.row}-${arrival.from.col}` : "piece"}
                      className={practice ? `${practiceStyles.pieceHolder} ${arrival ? practiceStyles.arrival : spawned ? practiceStyles.spawn : ""}` : undefined}
                      style={arrival ? { "--move-x": `calc(${arrival.from.col - arrival.to.col} * var(--tutorial-cell-pitch))`, "--move-y": `calc(${arrival.from.row - arrival.to.row} * var(--tutorial-cell-pitch))` } as CSSProperties : !practice ? { display: "contents" } : undefined}>
                      <PieceComponent
                        piece={piece}
                        isSelected={isSelected}
                        onPieceClick={() => handleSquareClick(rowIndex, colIndex)}
                      />
                    </div>}
                    {isHighlighted && !piece && <div className={styles.moveIndicator} />}
                  </div>
                );
              }),
            )}
          </div>
          {practice?.overlay}
        </div>

        {!practice && selectedSquare && selectedPiece && (
          <div className={styles.pieceInfo}>
            <h4>Peça Selecionada</h4>
            <p>Tipo: {getPieceLabel(selectedPiece.type)}</p>
            <p>Posição: ({selectedSquare.row + 1}, {selectedSquare.col + 1})</p>
            <p>Ações disponíveis: {availableActions.length}</p>
          </div>
        )}

        {!practice && finalWin && (
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
