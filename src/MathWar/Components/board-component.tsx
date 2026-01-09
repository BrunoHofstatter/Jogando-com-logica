import React, { useState, useEffect } from "react";
import {
  GameState,
  Position,
  Piece,
  TurnAction,
  GameConfig,
  GameRules,
  WinResult,
} from "../Logic/types";
import { GameEngine } from "../Logic/gameEngine";
import PieceComponent from "./piece";
import styles from "../styles/board.module.css";
import { VictoryScreen } from "./VictoryScreen";

interface BoardProps {
  gameConfig: GameConfig;
  gameRules: GameRules;
  gameState?: GameState;
  onGameStateChange?: (newState: GameState) => void;
  isAIMode?: boolean;
}

const Board: React.FC<BoardProps> = ({
  gameConfig,
  gameRules,
  gameState: externalGameState,
  onGameStateChange,
  isAIMode = false,
}) => {
  const engine = new GameEngine();
  const [internalGameState, setInternalGameState] = useState<GameState>(() =>
    engine.initializeGame(gameConfig, gameRules)
  );
  const [gameOver, setGameOver] = useState(false);
  const gameState = externalGameState || internalGameState;
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [availableActions, setAvailableActions] = useState<TurnAction[]>([]);
  const [highlightedSquares, setHighlightedSquares] = useState<Position[]>([]);
  const [winResult, setWinResult] = useState<WinResult | null>(null);

  useEffect(() => {
    if (selectedSquare) {
      const actions = engine.getAvailableActions(
        gameState,
        gameRules,
        selectedSquare
      );
      setAvailableActions(actions);

      const highlights: Position[] = [];
      actions.forEach((action) => {
        if (action.to) {
          highlights.push(action.to);
        }
      });
      setHighlightedSquares(highlights);
    } else {
      const allActions = engine.getAvailableActions(gameState, gameRules);
      setAvailableActions(allActions);
      setHighlightedSquares([]);
    }
  }, [selectedSquare, gameState]);

  // Check for win conditions
  useEffect(() => {
    const result = gameRules.checkWinCondition(gameState);
    setWinResult(result);
    if (result && gameState.gamePhase !== "ended") {
      setGameOver(true);
      const newState: GameState = {
        ...gameState,
        gamePhase: "ended" as const,
        winner: result.winner,
      };

      if (onGameStateChange) {
        onGameStateChange(newState);
      } else {
        setInternalGameState(newState);
      }
    }
  }, [gameState]);

  // Handle play again action
  const handlePlayAgain = () => {
    const newGameState = engine.initializeGame(gameConfig, gameRules);
    setGameOver(false);
    setWinResult(null);
    setSelectedSquare(null);
    setAvailableActions([]);
    setHighlightedSquares([]);

    if (onGameStateChange) {
      onGameStateChange(newGameState);
    } else {
      setInternalGameState(newGameState);
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    const clickedPosition = { row, col };
    const clickedPiece = gameState.board[row][col];

    if (gameState.gamePhase === "ended") {
      return;
    }

    if (clickedPiece && clickedPiece.isObstacle) {
      return;
    }

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        return;
      }

      const validAction = availableActions.find(
        (action) => action.to?.row === row && action.to?.col === col
      );

      if (validAction) {
        const success = engine.executeAction(gameState, validAction, gameRules);

        if (success) {
          if (onGameStateChange) {
            onGameStateChange(gameState);
          } else {
            setInternalGameState({ ...gameState });
          }

          setSelectedSquare(null);
        }
      } else if (
        clickedPiece &&
        clickedPiece.owner === gameState.currentPlayer
      ) {
        setSelectedSquare(clickedPosition);
      } else {
        const placeAction = availableActions.find(
          (action) =>
            action.type === "place" &&
            action.to?.row === row &&
            action.to?.col === col
        );

        if (placeAction) {
          const success = engine.executeAction(
            gameState,
            placeAction,
            gameRules
          );

          if (success) {
            if (onGameStateChange) {
              onGameStateChange(gameState);
            } else {
              setInternalGameState({ ...gameState });
            }
          }
        }

        setSelectedSquare(null);
      }
    } else {
      if (clickedPiece && clickedPiece.owner === gameState.currentPlayer) {
        setSelectedSquare(clickedPosition);
      } else if (!clickedPiece) {
        const placeAction = availableActions.find(
          (action) =>
            action.type === "place" &&
            action.to?.row === row &&
            action.to?.col === col
        );

        if (placeAction) {
          const success = engine.executeAction(
            gameState,
            placeAction,
            gameRules
          );

          if (success) {
            if (onGameStateChange) {
              onGameStateChange(gameState);
            } else {
              setInternalGameState({ ...gameState });
            }
          }
        }
      }
    }
  };

  const handleSpecialAction = (actionType: string) => {
    const specialAction = availableActions.find(
      (action) => action.type === actionType
    );

    if (specialAction) {
      const success = engine.executeAction(gameState, specialAction, gameRules);

      if (success) {
        if (onGameStateChange) {
          onGameStateChange(gameState);
        } else {
          setInternalGameState({ ...gameState });
        }
        setSelectedSquare(null);
      }
    }
  };

  const handleDiceRoll = () => {
    const diceAction: TurnAction = { type: "roll_dice" };
    const success = engine.executeAction(gameState, diceAction, gameRules);

    if (success) {
      if (onGameStateChange) {
        onGameStateChange(gameState);
      } else {
        setInternalGameState({ ...gameState });
      }
    }
  };

  const isSquareSelected = (row: number, col: number): boolean => {
    return (
      selectedSquare !== null &&
      selectedSquare.row === row &&
      selectedSquare.col === col
    );
  };

  const isSquareHighlighted = (row: number, col: number): boolean => {
    return highlightedSquares.some((pos) => pos.row === row && pos.col === col);
  };

  const canPlaceHere = (row: number, col: number): boolean => {
    return availableActions.some(
      (action) =>
        action.type === "place" &&
        action.to?.row === row &&
        action.to?.col === col
    );
  };

  const currentPlayerName = `Player ${gameState.currentPlayer + 1}`;
  const currentPlayerData =
    gameState.playerData?.[gameState.currentPlayer] || {};
  const barriersLeft = currentPlayerData.barriersLeft || 0;
  const finalWin: WinResult | null =
    winResult ??
    (gameState.gamePhase === "ended" && gameState.winner !== null
      ? { winner: gameState.winner, reason: "Game Over" }
      : null);

  return (
    <div className={styles.gamePage}>
      <div className={styles.gameContainer}>
        <div className={styles.gameInfo}>
          <div className={styles.currentPlayer} data-target='player'>
            Turno do Jogador
            <span
              className={`${styles.playerIndicator} ${
                gameState.currentPlayer === 0
                  ? styles.playerRed
                  : styles.playerBlue
              }`}
            >
              {gameState.currentPlayer === 0 ? "●" : "●"}
            </span>
          </div>

          <div className={styles.sectionInfo} data-target='info'>
            {/* Dice Roll Display */}
            {gameState.lastDiceRoll && (
              <div className={styles.diceInfo}>
                <div className={styles.diceDisplay}>
                  <span>
                    Dado:{" "}
                    <strong>
                      {gameState.lastDiceRoll.reduce(
                        (sum, die) => sum + die,
                        0
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* Selected Piece Energy Display */}
            <div className={styles.energyInfo}>
              <div className={styles.energyDisplay}>
                <span>
                  Energia da peça:{" "}
                  <strong>
                    {" "}
                    {selectedSquare &&
                    gameState.board[selectedSquare.row] &&
                    gameState.board[selectedSquare.row][selectedSquare.col]
                      ? gameState.board[selectedSquare.row][selectedSquare.col]
                          ?.data?.pieceEnergy || "0"
                      : "0"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.boardWrapper}>
          <div
            className={styles.board}
            data-target='board'
            style={{
              gridTemplateColumns: `repeat(${gameState.config.boardWidth}, clamp(2.6vw,9.15dvh,5vw))`,
              gridTemplateRows: `repeat(${gameState.config.boardHeight}, clamp(2.6vw,9.15dvh,5vw))`,
            }}
          >
            {gameState.board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isSelected = isSquareSelected(rowIndex, colIndex);
                const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
                const canPlace = !piece && canPlaceHere(rowIndex, colIndex);
                const isObstacle = piece && piece.isObstacle;
                const squareType =
                  (rowIndex + colIndex) % 2 === 0
                    ? styles.lightSquare
                    : styles.darkSquare;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    data-square={`${String.fromCharCode(97 + colIndex)}${rowIndex + 1}`}
                    data-piece={piece ? `${piece.owner === 0 ? 'red' : 'blue'}-${piece.type}` : undefined}
                    data-captain={piece?.data?.isCaptain ? 'true' : undefined}
                    className={`${styles.square} ${squareType} ${
                      isObstacle ? styles.squareObstacle : ""
                    } ${isHighlighted ? styles.squareHighlighted : ""} ${
                      canPlace ? styles.squareCanPlace : ""
                    }`}
                    onClick={() =>
                      !isObstacle && handleSquareClick(rowIndex, colIndex)
                    }
                  >
                    {piece && (
                      <PieceComponent
                        piece={piece}
                        gameConfig={gameState.config}
                        isSelected={isSelected}
                        onPieceClick={() =>
                          !isObstacle && handleSquareClick(rowIndex, colIndex)
                        }
                      />
                    )}

                    {isHighlighted && !piece && (
                      <div className={styles.moveIndicator} />
                    )}

                    {canPlace && <div className={styles.placeIndicator} />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.actionButtons}>
          {gameState.config.useDice && !gameState.lastDiceRoll && (
            <button
              onClick={handleDiceRoll}
              className={`${styles.actionButton} ${styles.actionButtonDice}`}
              disabled={!!winResult}
            >
              Roll Dice
            </button>
          )}

          {availableActions
            .filter((action) => action.type === "custom")
            .map((action, index) => (
              <button
                key={index}
                onClick={() => handleSpecialAction("custom")}
                className={`${styles.actionButton} ${styles.actionButtonCustom}`}
                disabled={!!winResult}
              >
                {action.data?.buttonText || "Custom Action"}
              </button>
            ))}

          {/* Skip turn button hidden as requested */}
          {/* {availableActions.length === 0 && gameState.gamePhase === "playing" && (
            <button
              onClick={() => {
                const skipAction: TurnAction = { type: 'custom', data: { skip: true } };
                engine.executeAction(gameState, skipAction, gameRules);
                if (onGameStateChange) {
                  onGameStateChange(gameState);
                } else {
                  setInternalGameState({...gameState});
                }
              }}
              className={`${styles.actionButton} ${styles.actionButtonSkip}`}
              disabled={!!winResult}
            >
              Skip Turn
            </button>
          )} */}
        </div>

        {selectedSquare &&
          gameState.board[selectedSquare.row][selectedSquare.col] && (
            <div className={styles.pieceInfo}>
              <h4>Selected Piece</h4>
              <p>
                Type:{" "}
                {gameState.board[selectedSquare.row][selectedSquare.col]?.type}
              </p>
              <p>
                Position: ({selectedSquare.row}, {selectedSquare.col})
              </p>
              {gameState.board[selectedSquare.row][selectedSquare.col]
                ?.value !== undefined && (
                <p>
                  Value:{" "}
                  {
                    gameState.board[selectedSquare.row][selectedSquare.col]
                      ?.value
                  }
                </p>
              )}
              <p>Available Actions: {availableActions.length}</p>
            </div>
          )}
        {finalWin && (
          <VictoryScreen
            winner={finalWin.winner}
            reason={finalWin.reason}
            onPlayAgain={handlePlayAgain}
            isAIMode={isAIMode}
          />
        )}
      </div>
    </div>
  );
};

export default Board;
