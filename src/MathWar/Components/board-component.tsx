import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowBigDownDash,
  ArrowBigLeftDash,
  ArrowBigRightDash,
  ArrowBigUpDash,
} from "lucide-react";

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
  MoveEvaluation,
  MoveIntent,
  PlayerId,
  Position,
} from "../Logic/v2";
import PieceComponent from "./piece";
import styles from "../styles/board.module.css";
import { VictoryScreen } from "./VictoryScreen";

const HINT_SYSTEM_CONFIG = {
  samePieceMissesToReveal: 3,
  turnMissesToReveal: 6,
  directionPreviewDistance: 3,
  feedbackDurationMs: 4000,
  feedbackFadeMs: 350,
  showNumericFeedback: true,
  showDirectionArrows: true,
} as const;

type DirectionKey =
  | "up"
  | "down"
  | "left"
  | "right"
  | "upLeft"
  | "upRight"
  | "downLeft"
  | "downRight";

type PreviewStrength = 1 | 2 | 3;

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
  const [samePieceMisses, setSamePieceMisses] = useState(0);
  const [turnMisses, setTurnMisses] = useState(0);
  const [revealedHintsPieceId, setRevealedHintsPieceId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const feedbackHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const turnRevealActive =
    turnMisses >= HINT_SYSTEM_CONFIG.turnMissesToReveal;
  const exactHintsVisible =
    selectedPiece !== null &&
    (turnRevealActive || revealedHintsPieceId === selectedPiece.id);
  const highlightedSquares = exactHintsVisible
    ? availableActions.map((action) => action.to)
    : [];
  const visibleDirections = useMemo(
    () =>
      HINT_SYSTEM_CONFIG.showDirectionArrows && selectedSquare
        ? getAvailableDirections(selectedSquare, availableActions)
        : [],
    [availableActions, selectedSquare],
  );
  const directionalPreviewMap = useMemo(
    () =>
      selectedSquare && !exactHintsVisible
        ? getDirectionalPreviewMap(
            gameState,
            selectedSquare,
            visibleDirections,
            HINT_SYSTEM_CONFIG.directionPreviewDistance,
          )
        : new Map<string, PreviewStrength>(),
    [exactHintsVisible, gameState, selectedSquare, visibleDirections],
  );
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

  const clearFeedbackTimers = () => {
    if (feedbackHideTimerRef.current) {
      clearTimeout(feedbackHideTimerRef.current);
      feedbackHideTimerRef.current = null;
    }

    if (feedbackClearTimerRef.current) {
      clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }
  };

  const clearFeedback = () => {
    clearFeedbackTimers();
    setFeedbackVisible(false);
    setFeedbackMessage(null);
  };

  const showFeedback = (message: string) => {
    clearFeedbackTimers();
    setFeedbackMessage(message);
    setFeedbackVisible(true);

    feedbackHideTimerRef.current = setTimeout(() => {
      setFeedbackVisible(false);

      feedbackClearTimerRef.current = setTimeout(() => {
        setFeedbackMessage(null);
      }, HINT_SYSTEM_CONFIG.feedbackFadeMs);
    }, HINT_SYSTEM_CONFIG.feedbackDurationMs);
  };

  const resetAllHintState = () => {
    setSelectedSquare(null);
    setSamePieceMisses(0);
    setTurnMisses(0);
    setRevealedHintsPieceId(null);
    clearFeedback();
  };

  useEffect(() => {
    setSelectedSquare(null);
    setSamePieceMisses(0);
    setTurnMisses(0);
    setRevealedHintsPieceId(null);

    if (feedbackHideTimerRef.current) {
      clearTimeout(feedbackHideTimerRef.current);
      feedbackHideTimerRef.current = null;
    }

    if (feedbackClearTimerRef.current) {
      clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }

    setFeedbackVisible(false);
    setFeedbackMessage(null);
  }, [gameState]);

  useEffect(() => () => {
    if (feedbackHideTimerRef.current) {
      clearTimeout(feedbackHideTimerRef.current);
      feedbackHideTimerRef.current = null;
    }

    if (feedbackClearTimerRef.current) {
      clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }
  }, []);

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
    resetAllHintState();
  };

  const handlePieceSelection = (position: Position | null) => {
    const nextPieceId = position
      ? gameState.board[position.row]?.[position.col]?.id ?? null
      : null;
    const currentPieceId = selectedPiece?.id ?? null;

    if (nextPieceId !== currentPieceId) {
      setSamePieceMisses(0);
      if (!turnRevealActive) {
        setRevealedHintsPieceId(null);
      }
      clearFeedback();
    }

    setSelectedSquare(position);
  };

  const handleInvalidMove = (evaluation: MoveEvaluation) => {
    const nextSamePieceMisses = samePieceMisses + 1;
    const nextTurnMisses = turnMisses + 1;
    const shouldRevealHints = Boolean(
      selectedPiece &&
        (nextSamePieceMisses >= HINT_SYSTEM_CONFIG.samePieceMissesToReveal ||
          nextTurnMisses >= HINT_SYSTEM_CONFIG.turnMissesToReveal),
    );

    setSamePieceMisses(nextSamePieceMisses);
    setTurnMisses(nextTurnMisses);

    if (shouldRevealHints && selectedPiece) {
      setRevealedHintsPieceId(selectedPiece.id);
    }

    showFeedback(
      formatMoveFeedback(evaluation, {
        showNumericFeedback: HINT_SYSTEM_CONFIG.showNumericFeedback,
        revealExactHints: shouldRevealHints,
      }),
    );
  };

  const commitAction = (action: MathWarAction) => {
    if (mode === "remote") {
      onMoveIntent?.({
        from: action.from,
        to: action.to,
      });
      resetAllHintState();
      return;
    }

    const result = applyAction(gameState, action);
    if (!result.ok) {
      handleInvalidMove(result.evaluation);
      return;
    }

    updateGameState(result.state);
    resetAllHintState();
  };

  const handleSquareClick = (row: number, col: number) => {
    const clickedPosition = { row, col };
    const clickedPiece = gameState.board[row][col];

    if (interactionBlocked) {
      return;
    }

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        handlePieceSelection(null);
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

      if (clickedPiece?.owner === gameState.currentPlayer) {
        handlePieceSelection(clickedPosition);
        return;
      }

      handleInvalidMove(
        evaluateMove(gameState, {
          from: selectedSquare,
          to: clickedPosition,
        }),
      );
      return;
    }

    if (clickedPiece?.owner === gameState.currentPlayer) {
      handlePieceSelection(clickedPosition);
    }
  };

  const isSquareSelected = (row: number, col: number): boolean =>
    selectedSquare !== null &&
    selectedSquare.row === row &&
    selectedSquare.col === col;

  const isSquareHighlighted = (row: number, col: number): boolean =>
    highlightedSquares.some((position) => position.row === row && position.col === col);

  const selectedPieceEnergy = selectedPiece
    ? String(getPieceAvailableEnergy(gameState, selectedPiece))
    : "-";
  const roundsUntilNextRoll = getRoundsUntilNextRoll(gameState);

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
          </div>
        </div>

        <div className={styles.boardWrapper}>
          {feedbackMessage && (
            <div
              className={`${styles.boardFeedback} ${feedbackVisible ? "" : styles.boardFeedbackHidden}`}
            >
              {feedbackMessage}
            </div>
          )}

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
                const previewStrength =
                  directionalPreviewMap.get(`${rowIndex}-${colIndex}`) ?? null;
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
                    className={`${styles.square} ${squareType} ${isSelected ? styles.squareSelectedLayer : ""} ${!isHighlighted && previewStrength === 1 ? styles.squareDirectionalPreviewNear : ""} ${!isHighlighted && previewStrength === 2 ? styles.squareDirectionalPreviewMid : ""} ${!isHighlighted && previewStrength === 3 ? styles.squareDirectionalPreviewFar : ""} ${isHighlighted ? styles.squareHighlighted : ""}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {piece && (
                      <PieceComponent
                        piece={piece}
                        isSelected={isSelected}
                        onPieceClick={() => handleSquareClick(rowIndex, colIndex)}
                      />
                    )}

                    {isSelected && visibleDirections.length > 0 && (
                      <div className={styles.directionHintsLayer}>
                        {visibleDirections.map((direction) => (
                          <div
                            key={direction}
                            className={`${styles.directionHint} ${styles[getDirectionClassName(direction)]}`}
                          >
                            {renderDirectionIcon(direction)}
                          </div>
                        ))}
                      </div>
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

function getAvailableDirections(
  from: Position,
  actions: MathWarAction[],
): DirectionKey[] {
  const directions = new Set<DirectionKey>();

  actions.forEach((action) => {
    const direction = getDirectionFromPositions(from, action.to);
    if (direction) {
      directions.add(direction);
    }
  });

  return Array.from(directions);
}

function getDirectionalPreviewMap(
  state: MathWarState,
  from: Position,
  directions: DirectionKey[],
  maxDistance: number,
): Map<string, PreviewStrength> {
  const previewMap = new Map<string, PreviewStrength>();

  directions.forEach((direction) => {
    const vector = getDirectionVector(direction);
    if (!vector) {
      return;
    }

    for (let distance = 1; distance <= maxDistance; distance++) {
      const row = from.row + vector.row * distance;
      const col = from.col + vector.col * distance;

      if (!isPositionInBounds(state, { row, col })) {
        break;
      }

      const pieceOnSquare = state.board[row][col];
      previewMap.set(`${row}-${col}`, distance as PreviewStrength);

      if (pieceOnSquare) {
        break;
      }
    }
  });

  return previewMap;
}

function getDirectionFromPositions(
  from: Position,
  to: Position,
): DirectionKey | null {
  const rowDirection = Math.sign(to.row - from.row);
  const colDirection = Math.sign(to.col - from.col);

  if (rowDirection === -1 && colDirection === 0) {
    return "up";
  }

  if (rowDirection === 1 && colDirection === 0) {
    return "down";
  }

  if (rowDirection === 0 && colDirection === -1) {
    return "left";
  }

  if (rowDirection === 0 && colDirection === 1) {
    return "right";
  }

  if (rowDirection === -1 && colDirection === -1) {
    return "upLeft";
  }

  if (rowDirection === -1 && colDirection === 1) {
    return "upRight";
  }

  if (rowDirection === 1 && colDirection === -1) {
    return "downLeft";
  }

  if (rowDirection === 1 && colDirection === 1) {
    return "downRight";
  }

  return null;
}

function getDirectionVector(
  direction: DirectionKey,
): { row: number; col: number } | null {
  switch (direction) {
    case "up":
      return { row: -1, col: 0 };
    case "down":
      return { row: 1, col: 0 };
    case "left":
      return { row: 0, col: -1 };
    case "right":
      return { row: 0, col: 1 };
    case "upLeft":
      return { row: -1, col: -1 };
    case "upRight":
      return { row: -1, col: 1 };
    case "downLeft":
      return { row: 1, col: -1 };
    case "downRight":
      return { row: 1, col: 1 };
    default:
      return null;
  }
}

function isPositionInBounds(
  state: MathWarState,
  position: Position,
): boolean {
  return (
    position.row >= 0 &&
    position.row < state.board.length &&
    position.col >= 0 &&
    position.col < (state.board[0]?.length ?? 0)
  );
}

function getDirectionClassName(direction: DirectionKey): string {
  switch (direction) {
    case "up":
      return "directionUp";
    case "down":
      return "directionDown";
    case "left":
      return "directionLeft";
    case "right":
      return "directionRight";
    case "upLeft":
      return "directionUpLeft";
    case "upRight":
      return "directionUpRight";
    case "downLeft":
      return "directionDownLeft";
    case "downRight":
      return "directionDownRight";
    default:
      return "directionUp";
  }
}

function renderDirectionIcon(direction: DirectionKey): React.JSX.Element {
  switch (direction) {
    case "up":
      return <ArrowBigUpDash />;
    case "down":
      return <ArrowBigDownDash />;
    case "left":
      return <ArrowBigLeftDash />;
    case "right":
      return <ArrowBigRightDash />;
    case "upLeft":
      return <ArrowBigUpDash className={styles.iconRotateLeft} />;
    case "upRight":
      return <ArrowBigUpDash className={styles.iconRotateRight} />;
    case "downLeft":
      return <ArrowBigDownDash className={styles.iconRotateRight} />;
    case "downRight":
      return <ArrowBigDownDash className={styles.iconRotateLeft} />;
    default:
      return <ArrowBigUpDash />;
  }
}

function formatMoveFeedback(
  evaluation: MoveEvaluation,
  options: {
    showNumericFeedback: boolean;
    revealExactHints: boolean;
  },
): string {
  const baseMessage = getBaseFeedbackMessage(evaluation, options.showNumericFeedback);

  if (options.revealExactHints) {
    return `${baseMessage} Veja as casas que a peça pode ir`;
  }

  return baseMessage;
}

function getBaseFeedbackMessage(
  evaluation: MoveEvaluation,
  showNumericFeedback: boolean,
): string {
  switch (evaluation.invalidReason) {
    case "out_of_bounds":
      return "Escolha uma casa dentro do tabuleiro.";
    case "same_square":
      return "Escolha outra casa para mover.";
    case "no_piece":
      return "Escolha uma peça para jogar.";
    case "not_your_piece":
      return "Escolha uma peça sua.";
    case "ally_on_destination":
      return "Essa casa já está ocupada por uma peça sua.";
    case "invalid_direction":
      return evaluation.piece?.type === "sumDiag"
        ? "Essa peça só anda na diagonal."
        : "Essa peça só anda em linha reta.";
    case "path_blocked":
      return "Há uma peça no caminho.";
    case "insufficient_energy":
      return getEnergyFeedbackMessage(evaluation, showNumericFeedback);
    case "game_over":
      return "A partida já terminou.";
    default:
      return "Esse movimento não é válido.";
  }
}

function getEnergyFeedbackMessage(
  evaluation: MoveEvaluation,
  showNumericFeedback: boolean,
): string {
  const availableEnergy = evaluation.availableEnergy;
  const requiredEnergy = evaluation.requiredEnergy;

  if (evaluation.cost?.captainRuleChangedCost) {
    if (showNumericFeedback) {
      return `O Capitão gasta o dobro de energia. Você tem ${availableEnergy}, mas esse movimento custa ${requiredEnergy}.`;
    }

    return "O Capitão gasta o dobro de energia.";
  }

  if (evaluation.cost?.captureAddsCost) {
    if (showNumericFeedback) {
      return `Capturar custa energia extra. Você tem ${availableEnergy}, mas esse movimento custa ${requiredEnergy}.`;
    }

    return "Capturar custa energia extra.";
  }

  if (showNumericFeedback) {
    return `Você tem ${availableEnergy} de energia, mas esse movimento custa ${requiredEnergy}.`;
  }

  return "Energia insuficiente.";
}

export default Board;
