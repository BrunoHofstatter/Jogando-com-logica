import { useEffect, useState } from "react";
import styles from "../Style/SPTTT.module.css";
import { Piece } from "./Piece";
import { WinnerOverlay } from "./WinnerBox";
import { useLocation } from "react-router-dom";
import {
  Player,
  BoardResult,
  MiniBoard,
  UltimateBoard,
  checkWinner,
  checkBigBoardWinner,
  isValidMove,
  getNextBoard,
} from "../Logic/gameUtils";
import { getAIMove } from "../Logic/aiPlayer";

interface SPTTTProps {
  winCondition: "line" | "majority";
  isAiMode?: boolean;
  difficulty?: 1 | 2 | 3 | 4;
}

export default function SPTTT({ winCondition, isAiMode = false, difficulty = 1 }: SPTTTProps) {
  const [boards, setBoards] = useState<UltimateBoard>(
    Array.from({ length: 9 }, () => Array(9).fill(null))
  );
  const [winners, setWinners] = useState<Array<BoardResult>>(
    Array(9).fill(null)
  );
  const [hoveredCell, setHoveredCell] = useState<{
    boardIndex: number;
    cellIndex: number;
  } | null>(null);
  const [previewBoard, setPreviewBoard] = useState<number | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [activeBoard, setActiveBoard] = useState<number | null>(null);
  const location = useLocation();
  const [winningBoardLine, setWinningBoardLine] = useState<number[] | null>(
    null
  );
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [tapCell, setTapCell] = useState<{
    boardIndex: number;
    cellIndex: number;
  } | null>(null);

  const [finalWinner, setFinalWinner] = useState<"X" | "O" | "tie" | null>(
    null
  );

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };

    checkTouchDevice();
    window.addEventListener("resize", checkTouchDevice);

    return () => {
      window.removeEventListener("resize", checkTouchDevice);
    };
  }, []);

  // AI Logic
  // AI Logic
  useEffect(() => {
    const { winner: currentWinner } = checkBigBoardWinner(winners, winCondition);

    if (
      isAiMode &&
      currentPlayer === "O" &&
      !finalWinner &&
      !currentWinner && // Check immediate winner state
      winners.some((w) => w === null) // Ensure game isn't over (rough check, checkBigBoardWinner handles real end)
    ) {
      // Small delay for UX
      const timer = setTimeout(() => {
        try {
          // Double check winner inside timeout just in case
          const { winner: winnerNow } = checkBigBoardWinner(winners, winCondition);
          if (winnerNow) return;

          const aiMove = getAIMove(boards, winners, activeBoard, difficulty);
          handleClick(aiMove.boardIndex, aiMove.cellIndex);
        } catch (e) {
          console.error("AI failed to make a move", e);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, isAiMode, finalWinner, boards, winners, activeBoard, difficulty, winCondition]);

  const handleTouchStart = (boardIndex: number, cellIndex: number) => {
    if (
      !isValidMove(boardIndex, cellIndex, boards, winners, activeBoard)
    )
      return;

    // Prevent human from touching if it's AI turn
    if (isAiMode && currentPlayer === 'O') return;

    if (
      tapCell &&
      tapCell.boardIndex === boardIndex &&
      tapCell.cellIndex === cellIndex
    ) {
      handleClick(boardIndex, cellIndex);
      setTapCell(null);
    } else {
      setTapCell({ boardIndex, cellIndex });
      const nextBoard = getNextBoard(cellIndex, winners);
      setPreviewBoard(nextBoard);
    }
  };

  useEffect(() => {
    setTapCell(null);
    setPreviewBoard(null);
  }, [activeBoard, currentPlayer]);

  useEffect(() => {
    if (winCondition === "majority") {
      const newScores = {
        X: winners.filter((winner) => winner === "X").length,
        O: winners.filter((winner) => winner === "O").length,
      };
      setScores(newScores);
    }
  }, [winners, winCondition]);

  const handleClick = (boardIndex: number, cellIndex: number) => {
    if (winners[boardIndex] !== null) return;
    if (boards[boardIndex][cellIndex] !== null) return;
    if (activeBoard !== null && activeBoard !== boardIndex) return;
    if (winners[boardIndex]) return;

    const newBoards: UltimateBoard = boards.map((board, bIdx) =>
      bIdx === boardIndex
        ? board.map((cell, cIdx) => (cIdx === cellIndex ? currentPlayer : cell))
        : board
    );

    const boardWinner = checkWinner(newBoards[boardIndex]);
    const newWinners = [...winners];
    if (boardWinner) {
      newWinners[boardIndex] = boardWinner;
    }

    setBoards(newBoards);
    setWinners(newWinners);

    const nextBoard = getNextBoard(cellIndex, newWinners);
    setActiveBoard(nextBoard);
    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");

    const { winner: bigWinner, winningLine } = checkBigBoardWinner(
      newWinners,
      winCondition
    );

    if (winningLine) {
      setWinningBoardLine(winningLine);
      setTimeout(() => setWinningBoardLine(null), 1000);
    }

    if (bigWinner) {
      setTimeout(() => {
        setFinalWinner(bigWinner);
      }, 2000); // delay for animations if needed
    }
  };

  const restartGame = () => {
    setBoards(Array.from({ length: 9 }, () => Array(9).fill(null)));
    setWinners(Array(9).fill(null));
    setCurrentPlayer("X");
    setActiveBoard(null);
    setFinalWinner(null);
    setWinningBoardLine(null);
  };

  return (
    <div className={styles["jogo-SPTTT"]}>
      <div className={styles.statWrap}>
        {/* Turn indicator */}
        <div className={styles["turn-indicator"]} data-target="player">
          <span>Turno do jogador:</span>
          <div className={styles["current-player-symbol"]}>
            <Piece player={currentPlayer!} />
          </div>
        </div>

        {isAiMode && (
          <div className={styles["difficulty-indicator"]}>
            <span>Dificuldade: {difficulty === 1 ? "Muito Fácil" : difficulty === 2 ? "Fácil" : difficulty === 3 ? "Médio" : "Difícil"}</span>
          </div>
        )}

        {winCondition === "majority" && (
          <div className={styles.scoreDisplayWrap}>
            <div className={styles.scoreDisplay}>
              <div className={styles.score}>
                <Piece player="X" />
                <span> : {scores.X}</span>
              </div>
              <div className={styles.scoreSeparator}>-</div>
              <div className={styles.score}>
                <Piece player="O" />
                <span> : {scores.O}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles["board-wrap"]}>
        <div className={styles["big-board"]} data-target="bigboard">
          {boards.map((board, boardIndex) => {
            const isPreviewBoard = previewBoard === boardIndex;

            return (
              <div
                key={boardIndex}
                data-target={`smallboard-${boardIndex}`}
                className={`${styles["small-board"]} ${activeBoard === null || activeBoard === boardIndex
                  ? styles.playable
                  : ""
                  } ${winners[boardIndex]
                    ? winners[boardIndex] === "tie"
                      ? styles.tied
                      : styles.won
                    : ""
                  } ${isPreviewBoard ? styles.previewNext : ""} ${winningBoardLine?.includes(boardIndex)
                    ? styles.winningBoard
                    : ""
                  }`}
              >
                {winners[boardIndex] && winners[boardIndex] !== "tie" && (
                  <div className={styles["board-winner"]}>
                    <Piece player={winners[boardIndex] as "X" | "O"} />
                  </div>
                )}
                {winners[boardIndex] === "tie" && (
                  <div className={`${styles["board-winner"]} ${styles.tie}`}>
                    {/* Tie indicator if desired */}
                  </div>
                )}
                {board.map((cell, cellIndex) => {
                  const isValid = isValidMove(
                    boardIndex,
                    cellIndex,
                    boards,
                    winners,
                    activeBoard
                  );
                  const showHoverPreview =
                    !cell &&
                    isValid &&
                    hoveredCell?.boardIndex === boardIndex &&
                    hoveredCell?.cellIndex === cellIndex;

                  const showTapPreview =
                    !cell &&
                    isValid &&
                    tapCell?.boardIndex === boardIndex &&
                    tapCell?.cellIndex === cellIndex;

                  // Disable interaction if it's AI turn and valid (just in case)
                  const isDisabled = !isValid || (isAiMode && currentPlayer === 'O');

                  return (
                    <button
                      key={cellIndex}
                      className={`${styles.casa} ${isValid ? styles.playableCell : ""
                        } ${tapCell?.boardIndex === boardIndex &&
                          tapCell?.cellIndex === cellIndex
                          ? styles.tappedCell
                          : ""
                        }`}
                      data-cell={`${boardIndex}-${cellIndex}`}
                      onClick={() => {
                        if (!isTouchDevice && !isDisabled) {
                          handleClick(boardIndex, cellIndex);
                        }
                      }}
                      onTouchStart={() => {
                        if (!isDisabled) {
                          handleTouchStart(boardIndex, cellIndex);
                        }
                      }}
                      disabled={isDisabled}
                      onMouseEnter={() => {
                        if (!isDisabled) {
                          setHoveredCell({ boardIndex, cellIndex });
                          const nextBoard = getNextBoard(cellIndex, winners);
                          setPreviewBoard(nextBoard);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCell(null);
                        setPreviewBoard(null);
                      }}
                    >
                      {cell && <Piece player={cell} />}
                      {showHoverPreview && (
                        <div className={styles.previewPiece}>
                          <Piece player={currentPlayer!} />
                        </div>
                      )}
                      {showTapPreview && (
                        <div className={styles.previewPiece}>
                          <Piece player={currentPlayer!} />
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

      {/* Winner Overlay */}
      {finalWinner && (
        <WinnerOverlay winner={finalWinner} onRestart={restartGame} isAiMode={isAiMode} />
      )}
    </div>
  );
}
