import React, { useEffect, useMemo, useState } from "react";

import {
  applyAction,
  createInitialState,
  evaluateMove,
  getDiceTotal,
  getLegalActions,
  getLegalActionsForPiece,
  getPieceAvailableEnergy,
  getRoundsUntilNextRoll,
  resolveMoveIntent,
} from "../Logic/v2";
import type {
  MathWarAction,
  MathWarState,
  MoveIntent,
  MoveEvaluation,
  PlayerId,
  Position,
} from "../Logic/v2";
import PieceComponent from "./piece";
import styles from "../styles/board.module.css";
import { VictoryScreen } from "./VictoryScreen";

interface BoardProps {
  mode?: "local" | "remote";
  gameState?: MathWarState;
  onGameStateChange?: (newState: MathWarState) => void;
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
  const [internalGameState, setInternalGameState] = useState<MathWarState>(() =>
    createInitialState(),
  );
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [lastMoveEvaluation, setLastMoveEvaluation] = useState<MoveEvaluation | null>(null);
  const gameState = externalGameState ?? internalGameState;
  const selectedPiece = selectedSquare
    ? gameState.board[selectedSquare.row]?.[selectedSquare.col] ?? null
    : null;
  const availableActions = useMemo(
    () =>
      selectedSquare && selectedPiece && selectedPiece.owner === gameState.currentPlayer
        ? getLegalActionsForPiece(gameState, selectedSquare)
        : [],
    [gameState, selectedPiece, selectedSquare],
  );
  const highlightedSquares = availableActions.map((action) => action.to);
  const allCurrentPlayerActions = useMemo(
    () => getLegalActions(gameState),
    [gameState],
  );
  const finalWin =
    gameState.status === "ended" && gameState.winner !== null
      ? {
          winner: gameState.winner,
          reason: gameState.endReason === "captain_captured"
            ? "Capitão capturado"
            : "Fim de jogo",
        }
      : null;
  const playerLabel =
    mode === "remote" && playerSeat !== undefined
      ? gameState.currentPlayer === playerSeat
        ? "Sua vez"
        : "Vez do oponente"
      : isAIMode && gameState.currentPlayer === 0
        ? "Computador"
        : "Jogador";
  const interactionBlocked =
    gameState.status === "ended" ||
    (mode === "remote"
      ? interactionLocked ||
        playerSeat === undefined ||
        gameState.currentPlayer !== playerSeat
      : isAIMode && gameState.currentPlayer === 0);

  useEffect(() => {
    setSelectedSquare(null);
    setLastMoveEvaluation(null);
  }, [gameState]);

  const updateGameState = (nextState: MathWarState) => {
    if (onGameStateChange) {
      onGameStateChange(nextState);
      return;
    }

    setInternalGameState(nextState);
  };

  const handlePlayAgain = () => {
    if (mode === "remote" && onPlayAgain) {
      onPlayAgain();
      return;
    }

    updateGameState(createInitialState({ startingPlayer: isAIMode ? 1 : 0 }));
    setSelectedSquare(null);
    setLastMoveEvaluation(null);
  };

  const commitAction = (action: MathWarAction) => {
    if (mode === "remote") {
      onMoveIntent?.({
        from: action.from,
        to: action.to,
      });
      setSelectedSquare(null);
      setLastMoveEvaluation(null);
      return;
    }

    const result = applyAction(gameState, action);
    if (!result.ok) {
      setLastMoveEvaluation(result.evaluation);
      return;
    }

    updateGameState(result.state);
    setSelectedSquare(null);
    setLastMoveEvaluation(null);
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
        setLastMoveEvaluation(null);
        return;
      }

      const resolvedAction =
        resolveMoveIntent(gameState, {
          from: selectedSquare,
          to: clickedPosition,
        }) ??
        availableActions.find(
          (candidate) =>
            candidate.to.row === row && candidate.to.col === col,
        ) ??
        null;

      if (resolvedAction) {
        commitAction(resolvedAction);
        return;
      }

      const evaluation = evaluateMove(gameState, {
        from: selectedSquare,
        to: clickedPosition,
      });

      if (clickedPiece?.owner === gameState.currentPlayer) {
        setSelectedSquare(clickedPosition);
        setLastMoveEvaluation(null);
        return;
      }

      setLastMoveEvaluation(evaluation);
      return;
    }

    if (clickedPiece?.owner === gameState.currentPlayer) {
      setSelectedSquare(clickedPosition);
      setLastMoveEvaluation(null);
    }
  };

  const isSquareSelected = (row: number, col: number): boolean =>
    selectedSquare !== null &&
    selectedSquare.row === row &&
    selectedSquare.col === col;

  const isSquareHighlighted = (row: number, col: number): boolean =>
    highlightedSquares.some((position) => position.row === row && position.col === col);

  const selectedPieceEnergy = selectedPiece
    ? getPieceAvailableEnergy(gameState, selectedPiece)
    : 0;
  const selectedPieceMoves = selectedSquare ? availableActions.length : 0;
  const roundsUntilNextRoll = getRoundsUntilNextRoll(gameState);
  const lastInvalidReason = formatInvalidReason(lastMoveEvaluation?.invalidReason);

  return (
    <div className={styles.gamePage}>
      <div className={styles.gameContainer}>
        <div className={styles.gameInfo}>
          {isAIMode && difficulty && (
            <div className={styles.difficultyBox}>
              Nível: {difficulty === 1 ? "Muito Fácil" : difficulty === 2 ? "Fácil" : difficulty === 3 ? "Médio" : "Difícil"}
            </div>
          )}

          <div className={styles.currentPlayer} data-target="player">
            <div className={styles.turnText}>
              Turno {gameState.turnCount + 1}
            </div>
            <div className={styles.playerText}>
              {playerLabel}
              <span
                className={`${styles.playerIndicator} ${gameState.currentPlayer === 0 ? styles.playerRed : styles.playerBlue}`}
              >
                ●
              </span>
            </div>
          </div>

          <div className={styles.sectionInfo} data-target="info">
            <div className={styles.diceInfo}>
              <div className={styles.diceDisplay}>
                <span>
                  Dado: <strong>{getDiceTotal(gameState)}</strong>
                </span>
              </div>
              <div className={styles.nextRollIndicator}>
                Próximo: {roundsUntilNextRoll} {roundsUntilNextRoll === 1 ? "rodada" : "rodadas"}
              </div>
            </div>

            <div className={styles.energyInfo}>
              <div className={styles.energyDisplay}>
                <span>
                  Energia da peça: <strong>{selectedPieceEnergy}</strong>
                </span>
              </div>
            </div>

            {statusMessage && (
              <div className={styles.energyInfo}>
                <div className={styles.energyDisplay}>
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            {lastInvalidReason && (
              <div className={styles.energyInfo}>
                <div className={styles.energyDisplay}>
                  <span>
                    Falha: <strong>{lastInvalidReason}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.boardWrapper}>
          <div
            className={styles.board}
            data-target="board"
            style={{
              "--board-cols": gameState.board[0]?.length ?? 0,
              "--board-rows": gameState.board.length,
            } as React.CSSProperties}
          >
            {gameState.board.map((rowData, rowIndex) =>
              rowData.map((piece, colIndex) => {
                const isSelected = isSquareSelected(rowIndex, colIndex);
                const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
                const squareType =
                  (rowIndex + colIndex) % 2 === 0
                    ? styles.lightSquare
                    : styles.darkSquare;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    data-square={`${String.fromCharCode(97 + colIndex)}${rowIndex + 1}`}
                    data-piece={piece ? `${piece.owner === 0 ? "red" : "blue"}-${piece.type}` : undefined}
                    data-captain={piece?.isCaptain ? "true" : undefined}
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

                    {isHighlighted && !piece && (
                      <div className={styles.moveIndicator} />
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {selectedSquare && selectedPiece && (
          <div className={styles.pieceInfo}>
            <h4>Peça selecionada</h4>
            <p>Tipo: {selectedPiece.type === "sumDiag" ? "Soma quadrada" : "Soma redonda"}</p>
            <p>Posição: ({selectedSquare.row + 1}, {selectedSquare.col + 1})</p>
            <p>Valor: +{selectedPiece.value}</p>
            <p>Movimentos disponíveis: {selectedPieceMoves}</p>
          </div>
        )}

        {!selectedSquare && gameState.status === "playing" && allCurrentPlayerActions.length === 0 && (
          <div className={styles.pieceInfo}>
            <h4>Sem jogadas</h4>
            <p>O jogador atual não tem movimentos válidos com o dado atual.</p>
          </div>
        )}

        {finalWin && (
          <VictoryScreen
            winner={finalWin.winner}
            reason={finalWin.reason}
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

function formatInvalidReason(
  invalidReason: MoveEvaluation["invalidReason"] | undefined,
): string | null {
  switch (invalidReason) {
    case "out_of_bounds":
      return "Destino fora do tabuleiro";
    case "same_square":
      return "Escolha outra casa";
    case "no_piece":
      return "Não há peça nessa casa";
    case "not_your_piece":
      return "Essa peça não é sua";
    case "ally_on_destination":
      return "A casa já está ocupada por uma peça aliada";
    case "invalid_direction":
      return "A direção não combina com essa peça";
    case "path_blocked":
      return "Há peças bloqueando o caminho";
    case "insufficient_energy":
      return "Energia insuficiente";
    case "game_over":
      return "A partida já terminou";
    default:
      return null;
  }
}

export default Board;
