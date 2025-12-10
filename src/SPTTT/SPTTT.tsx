import { useEffect, useState } from "react";
import styles from "./SPTTT.module.css";
import { Piece } from "./Piece";
import { WinnerOverlay } from "./WinnerBox";
import { useLocation } from "react-router-dom";

type Player = "X" | "O" | null;
type BoardResult = Player | "tie";
type MiniBoard = Player[];
type UltimateBoard = MiniBoard[];

interface SPTTTProps {
  winCondition: "line" | "majority";
}

export default function SPTTT({ winCondition }: SPTTTProps) {
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
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0
      );
    };

    checkTouchDevice();
    window.addEventListener("resize", checkTouchDevice);

    return () => {
      window.removeEventListener("resize", checkTouchDevice);
    };
  }, []);

  const handleTouchStart = (boardIndex: number, cellIndex: number) => {
    if (!isValidMove(boardIndex, cellIndex)) return;

    if (tapCell && tapCell.boardIndex === boardIndex && tapCell.cellIndex === cellIndex) {
      handleClick(boardIndex, cellIndex);
      setTapCell(null);
    } else {
      setTapCell({ boardIndex, cellIndex });
      const nextBoard = getNextBoard(cellIndex);
      setPreviewBoard(nextBoard);
    }
  };

  useEffect(() => {
    setTapCell(null);
    setPreviewBoard(null);
  }, [activeBoard, currentPlayer]);

  const isValidMove = (boardIndex: number, cellIndex: number): boolean => {
    if (winners[boardIndex] !== null) return false;
    if (activeBoard !== null && activeBoard !== boardIndex) return false;
    if (boards[boardIndex][cellIndex] !== null) return false;
    return true;
  };

  const getNextBoard = (cellIndex: number): number | null => {
    if (winners[cellIndex] !== null) {
      return null;
    }
    return cellIndex;
  };

  useEffect(() => {
    if (winCondition === "majority") {
      const newScores = {
        X: winners.filter((winner) => winner === "X").length,
        O: winners.filter((winner) => winner === "O").length,
      };
      setScores(newScores);
    }
  }, [winners, winCondition]);
  function checkWinner(board: MiniBoard): BoardResult {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // cols
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (let [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    // Check for tie (board is full with no winner)
    if (board.every((cell) => cell !== null)) {
      return "tie";
    }

    return null;
  }

  function checkBigBoardWinner(
    winners: Array<BoardResult>
  ): BoardResult | null {
    if (winCondition === "line") {
      const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // cols
        [0, 4, 8],
        [2, 4, 6], // diagonals
      ];

      for (let [a, b, c] of lines) {
        if (
          winners[a] &&
          winners[a] === winners[b] &&
          winners[a] === winners[c] &&
          winners[a] !== "tie"
        ) {
          // Set the winning board line for animation
          setWinningBoardLine([a, b, c]);

          // Clear animation after it completes
          setTimeout(() => setWinningBoardLine(null), 1000);

          return winners[a];
        }
      }

      if (winners.every((winner) => winner !== null)) {
        return "tie";
      }
    } else {
      // Majority win condition (unchanged)
      if (winners.every((winner) => winner !== null)) {
        const countX = winners.filter((winner) => winner === "X").length;
        const countO = winners.filter((winner) => winner === "O").length;

        if (countX > countO) return "X";
        if (countO > countX) return "O";
        return "tie";
      }
    }

    return null;
  }

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

    const nextBoard = cellIndex;
    const targetBoardHasMoves =
      newBoards[nextBoard].some((cell) => cell === null) &&
      !newWinners[nextBoard];

    setActiveBoard(targetBoardHasMoves ? nextBoard : null);
    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");

    const bigWinner = checkBigBoardWinner(newWinners);

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
                className={`${styles["small-board"]} ${
                  activeBoard === null || activeBoard === boardIndex
                    ? styles.playable
                    : ""
                } ${
                  winners[boardIndex]
                    ? winners[boardIndex] === "tie"
                      ? styles.tied
                      : styles.won
                    : ""
                } ${isPreviewBoard ? styles.previewNext : ""} ${
                  winningBoardLine?.includes(boardIndex)
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
                  const isValid = isValidMove(boardIndex, cellIndex);
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

                  return (
                    <button
                      key={cellIndex}
                      className={`${styles.casa} ${
                        isValid ? styles.playableCell : ""
                      } ${
                        tapCell?.boardIndex === boardIndex &&
                        tapCell?.cellIndex === cellIndex
                          ? styles.tappedCell
                          : ""
                      }`}
                      data-cell={`${boardIndex}-${cellIndex}`}
                      onClick={() => {
                        if (!isTouchDevice && isValid) {
                          handleClick(boardIndex, cellIndex);
                        }
                      }}
                      onTouchStart={() => {
                        if (isValid) {
                          handleTouchStart(boardIndex, cellIndex);
                        }
                      }}
                      disabled={!isValid}
                      onMouseEnter={() => {
                        if (isValid) {
                          setHoveredCell({ boardIndex, cellIndex });
                          const nextBoard = getNextBoard(cellIndex);
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
        <WinnerOverlay winner={finalWinner} onRestart={restartGame} />
      )}
    </div>
  );
}
