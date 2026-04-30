import { useEffect, useState } from "react";

import styles from "../Style/SPTTT.module.css";
import { getAIMove } from "../Logic/aiPlayer";
import {
  applyMove,
  createInitialState,
  getNextActiveBoard,
  isMoveIntentValid,
} from "../Logic/v2";
import type { MoveIntent, SptttPlayer, SptttState } from "../Logic/v2";
import { Piece } from "./Piece";
import { WinnerOverlay } from "./WinnerBox";

interface SPTTTProps {
  mode?: "local" | "remote";
  gameState?: SptttState;
  onGameStateChange?: (state: SptttState) => void;
  onMoveIntent?: (intent: MoveIntent) => void;
  playerMark?: SptttPlayer;
  interactionLocked?: boolean;
  onPlayAgain?: () => void;
  onPlayAgainDisabled?: boolean;
  playAgainLabel?: string;
  statusMessage?: string | null;
  isAiMode?: boolean;
  difficulty?: 1 | 2 | 3 | 4;
  onUnlockNext?: () => void;
  onMenu?: () => void;
  onNextLevel?: () => void;
  showNextLevel?: boolean;
}

export default function SPTTT({
  mode = "local",
  gameState: externalGameState,
  onGameStateChange,
  onMoveIntent,
  playerMark,
  interactionLocked = false,
  onPlayAgain,
  onPlayAgainDisabled = false,
  playAgainLabel,
  statusMessage,
  isAiMode = false,
  difficulty = 1,
  onUnlockNext,
  onMenu,
  onNextLevel,
  showNextLevel,
}: SPTTTProps) {
  const [internalGameState, setInternalGameState] = useState<SptttState>(() =>
    createInitialState(),
  );
  const [hoveredCell, setHoveredCell] = useState<MoveIntent | null>(null);
  const [previewBoard, setPreviewBoard] = useState<number | null>(null);
  const [highlightedWinningLine, setHighlightedWinningLine] = useState<number[] | null>(null);
  const [displayedWinner, setDisplayedWinner] = useState<SptttState["winner"]>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [tapCell, setTapCell] = useState<MoveIntent | null>(null);
  const [hasAwardedUnlock, setHasAwardedUnlock] = useState(false);

  const gameState = externalGameState ?? internalGameState;
  const turnLabel =
    statusMessage ??
    (mode === "remote" && playerMark
      ? gameState.currentPlayer === playerMark
        ? "Sua vez"
        : "Vez do oponente"
      : isAiMode
        ? gameState.currentPlayer === "O"
          ? "Vez do computador"
          : "Sua vez"
        : "Turno do jogador:");
  const interactionBlocked =
    gameState.status === "ended" ||
    (mode === "remote"
      ? interactionLocked ||
        !playerMark ||
        gameState.currentPlayer !== playerMark
      : isAiMode && gameState.currentPlayer === "O");

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    };

    checkTouchDevice();
    window.addEventListener("resize", checkTouchDevice);

    return () => {
      window.removeEventListener("resize", checkTouchDevice);
    };
  }, []);

  useEffect(() => {
    setTapCell(null);
    setPreviewBoard(null);
    setHoveredCell(null);
  }, [gameState.activeBoard, gameState.currentPlayer, gameState.turnCount]);

  useEffect(() => {
    if (gameState.status !== "ended" || !gameState.winningLine) {
      setHighlightedWinningLine(null);
      return;
    }

    setHighlightedWinningLine(gameState.winningLine);
    const timeoutId = window.setTimeout(() => {
      setHighlightedWinningLine(null);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [gameState.status, gameState.winningLine, gameState.turnCount]);

  useEffect(() => {
    if (gameState.status !== "ended" || gameState.winner === null) {
      setDisplayedWinner(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDisplayedWinner(gameState.winner);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [gameState.status, gameState.winner, gameState.turnCount]);

  useEffect(() => {
    if (gameState.turnCount === 0) {
      setDisplayedWinner(null);
      setHasAwardedUnlock(false);
    }
  }, [gameState.turnCount]);

  useEffect(() => {
    if (
      !isAiMode ||
      hasAwardedUnlock ||
      gameState.status !== "ended" ||
      gameState.winner !== "X" ||
      !onUnlockNext
    ) {
      return;
    }

    onUnlockNext();
    setHasAwardedUnlock(true);
  }, [gameState.status, gameState.winner, hasAwardedUnlock, isAiMode, onUnlockNext]);

  useEffect(() => {
    if (
      !isAiMode ||
      mode !== "local" ||
      gameState.status !== "playing" ||
      gameState.currentPlayer !== "O"
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const aiMove = getAIMove(gameState, difficulty);
        const result = applyMove(gameState, aiMove);
        if (!result.ok) {
          return;
        }

        if (onGameStateChange) {
          onGameStateChange(result.state);
          return;
        }

        setInternalGameState(result.state);
      } catch (error) {
        console.error("AI failed to make a move", error);
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [difficulty, gameState, isAiMode, mode, onGameStateChange]);

  const updateGameState = (nextState: SptttState) => {
    if (onGameStateChange) {
      onGameStateChange(nextState);
      return;
    }

    setInternalGameState(nextState);
  };

  const commitMove = (intent: MoveIntent) => {
    if (mode === "remote") {
      onMoveIntent?.(intent);
      return;
    }

    const result = applyMove(gameState, intent);
    if (!result.ok) {
      return;
    }

    updateGameState(result.state);
  };

  const handleTouchStart = (boardIndex: number, cellIndex: number) => {
    const intent = { boardIndex, cellIndex };
    if (interactionBlocked || !isMoveIntentValid(gameState, intent)) {
      return;
    }

    if (tapCell?.boardIndex === boardIndex && tapCell.cellIndex === cellIndex) {
      commitMove(intent);
      setTapCell(null);
      return;
    }

    setTapCell(intent);
    setPreviewBoard(getNextActiveBoard(cellIndex, gameState.boardWinners));
  };

  const handleCellClick = (boardIndex: number, cellIndex: number) => {
    const intent = { boardIndex, cellIndex };
    if (interactionBlocked || !isMoveIntentValid(gameState, intent)) {
      return;
    }

    commitMove(intent);
  };

  const handlePlayAgain = () => {
    if (mode === "remote") {
      onPlayAgain?.();
      return;
    }

    updateGameState(createInitialState());
  };

  return (
    <div
      className={`${styles["jogo-SPTTT"]} ${displayedWinner ? styles["game-over"] : ""}`}
    >
      <div className={styles.statWrap}>
        <div className={styles["turn-indicator"]} data-target="player">
          <span>{turnLabel}</span>
          <div className={styles["current-player-symbol"]}>
            <Piece player={gameState.currentPlayer} />
          </div>
        </div>

        {isAiMode && (
          <div className={styles["difficulty-indicator"]}>
            <span>
              Dificuldade:{" "}
              {difficulty === 1
                ? "Muito Fácil"
                : difficulty === 2
                  ? "Fácil"
                  : difficulty === 3
                    ? "Médio"
                    : "Difícil"}
            </span>
          </div>
        )}
      </div>

      <div className={styles["board-wrap"]}>
        <div className={styles["big-board"]} data-target="bigboard">
          {gameState.boards.map((board, boardIndex) => {
            const boardWinner = gameState.boardWinners[boardIndex];
            const isPreviewBoard = previewBoard === boardIndex;
            const isBoardPlayable =
              gameState.status === "playing" &&
              gameState.activeBoard !== null &&
              gameState.activeBoard === boardIndex;
            const isBoardFreelyPlayable =
              gameState.status === "playing" && gameState.activeBoard === null;

            return (
              <div
                key={boardIndex}
                data-target={`smallboard-${boardIndex}`}
                className={`${styles["small-board"]} ${
                  isBoardFreelyPlayable
                    ? styles.playableStatic
                    : isBoardPlayable
                      ? styles.playable
                      : ""
                } ${
                  boardWinner
                    ? boardWinner === "tie"
                      ? styles.tied
                      : styles.won
                    : ""
                } ${
                  isPreviewBoard ? styles.previewNext : ""
                } ${
                  highlightedWinningLine?.includes(boardIndex) ? styles.winningBoard : ""
                }`}
              >
                {boardWinner && boardWinner !== "tie" && (
                  <div className={styles["board-winner"]}>
                    <Piece player={boardWinner} />
                  </div>
                )}

                {boardWinner === "tie" && (
                  <div className={`${styles["board-winner"]} ${styles.tie}`} />
                )}

                {board.map((cell, cellIndex) => {
                  const intent = { boardIndex, cellIndex };
                  const isValid = isMoveIntentValid(gameState, intent);
                  const showHoverPreview =
                    cell === null &&
                    isValid &&
                    hoveredCell?.boardIndex === boardIndex &&
                    hoveredCell.cellIndex === cellIndex;
                  const showTapPreview =
                    cell === null &&
                    isValid &&
                    tapCell?.boardIndex === boardIndex &&
                    tapCell.cellIndex === cellIndex;
                  const isDisabled = !isValid || interactionBlocked;

                  return (
                    <button
                      key={cellIndex}
                      className={`${styles.casa} ${
                        isValid ? styles.playableCell : ""
                      } ${
                        tapCell?.boardIndex === boardIndex &&
                        tapCell.cellIndex === cellIndex
                          ? styles.tappedCell
                          : ""
                      }`}
                      data-cell={`${boardIndex}-${cellIndex}`}
                      onClick={() => {
                        if (!isTouchDevice && !isDisabled) {
                          handleCellClick(boardIndex, cellIndex);
                        }
                      }}
                      onTouchStart={() => {
                        if (!isDisabled) {
                          handleTouchStart(boardIndex, cellIndex);
                        }
                      }}
                      disabled={isDisabled}
                      onMouseEnter={() => {
                        if (isDisabled) {
                          return;
                        }

                        setHoveredCell(intent);
                        setPreviewBoard(
                          getNextActiveBoard(cellIndex, gameState.boardWinners),
                        );
                      }}
                      onMouseLeave={() => {
                        setHoveredCell(null);
                        setPreviewBoard(null);
                      }}
                    >
                      {cell && <Piece player={cell} />}
                      {showHoverPreview && (
                        <div className={styles.previewPiece}>
                          <Piece player={gameState.currentPlayer} />
                        </div>
                      )}
                      {showTapPreview && (
                        <div className={styles.previewPiece}>
                          <Piece player={gameState.currentPlayer} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {displayedWinner && (
        <WinnerOverlay
          winner={displayedWinner}
          onRestart={handlePlayAgain}
          restartLabel={playAgainLabel}
          isRestartDisabled={onPlayAgainDisabled}
          isAiMode={isAiMode}
          onMenu={onMenu}
          onNextLevel={onNextLevel}
          showNextLevel={showNextLevel}
        />
      )}
    </div>
  );
}
