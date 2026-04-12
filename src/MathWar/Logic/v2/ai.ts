import { applyAction, getLegalActions, getLegalActionsForPiece, getPlayerPieces } from "./mathWar";
import type { MathWarAction, MathWarState, PlayerId, Position } from "./types";

export type AIDifficulty = 1 | 2 | 3 | 4;

export function getAIMove(
  state: MathWarState,
  difficulty: AIDifficulty = 1,
): MathWarAction | null {
  const availableMoves = getLegalActions(state);

  if (availableMoves.length === 0) {
    return null;
  }

  switch (difficulty) {
    case 1:
      return getRandomMove(availableMoves);
    case 2:
      return getDifficulty2Move(state, availableMoves);
    case 3:
      return getDifficulty3Move(state, availableMoves);
    case 4:
      return getDifficulty4Move(state, availableMoves);
    default:
      return getRandomMove(availableMoves);
  }
}

function getRandomMove(moves: MathWarAction[]): MathWarAction {
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
}

function getDifficulty2Move(
  state: MathWarState,
  moves: MathWarAction[],
): MathWarAction {
  const captures = moves.filter((move) => move.type === "capture");

  if (captures.length > 0) {
    const captainCaptures = captures.filter(
      (move) => state.board[move.to.row][move.to.col]?.isCaptain,
    );

    if (captainCaptures.length > 0) {
      return captainCaptures[0];
    }

    return getRandomMove(captures);
  }

  let candidates = [...moves];

  if (Math.random() < 0.8) {
    const highEnergyMoves = candidates.filter((move) => {
      const piece = state.board[move.from.row][move.from.col];
      const pieceEnergy = piece ? piece.value + state.diceRoll[0] + state.diceRoll[1] : 0;
      return move.cost.totalCost > pieceEnergy / 2;
    });

    if (highEnergyMoves.length > 0) {
      candidates = highEnergyMoves;
    }
  }

  if (Math.random() < 0.6) {
    const forwardMoves = candidates.filter((move) =>
      state.currentPlayer === 0
        ? move.to.row > move.from.row
        : move.to.row < move.from.row,
    );

    if (forwardMoves.length > 0) {
      candidates = forwardMoves;
    }
  }

  return getRandomMove(candidates);
}

function getDifficulty3Move(
  state: MathWarState,
  moves: MathWarAction[],
): MathWarAction {
  let bestScore = -Infinity;
  let bestMoves: MathWarAction[] = [];
  const captainPos = findCaptainPosition(state, state.currentPlayer);
  const isCaptainThreatenedNow =
    captainPos !== null
      ? isPositionThreatened(state, captainPos, state.currentPlayer)
      : false;

  for (const move of moves) {
    let score = Math.random() * 8;
    const movingPiece = state.board[move.from.row][move.from.col];
    const isMovingCaptain = Boolean(movingPiece?.isCaptain);
    const movingPieceValue = movingPiece?.value ?? 0;
    const isSumDiag = movingPiece?.type === "sumDiag";

    if (move.type === "capture") {
      const targetPiece = state.board[move.to.row][move.to.col];
      if (targetPiece?.isCaptain) {
        score += 10000;
      } else if (targetPiece?.type === "sumDiag") {
        score += 60 + targetPiece.value * 5;
      } else if (targetPiece) {
        score += 40 + targetPiece.value * 5;
      }
    }

    if (isCaptainThreatenedNow) {
      if (isMovingCaptain) {
        score += 500;
      } else if (move.type === "capture") {
        score += 100;
      }
    }

    const progress =
      state.currentPlayer === 0
        ? move.to.row - move.from.row
        : move.from.row - move.to.row;
    if (progress > 0) {
      score += progress * 0.2;
    }

    const simulatedState = simulateAction(state, move);
    if (simulatedState && isPositionThreatened(simulatedState, move.to, state.currentPlayer)) {
      let penalty = 20 + movingPieceValue * 10;
      if (isSumDiag) {
        penalty *= 2;
      }
      score -= penalty;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) < 0.001) {
      bestMoves.push(move);
    }
  }

  return getRandomMove(bestMoves);
}

function getDifficulty4Move(
  state: MathWarState,
  moves: MathWarAction[],
): MathWarAction {
  let bestScore = -Infinity;
  let bestMoves: MathWarAction[] = [];
  const captainPos = findCaptainPosition(state, state.currentPlayer);
  const isCaptainThreatenedNow =
    captainPos !== null
      ? isPositionThreatened(state, captainPos, state.currentPlayer)
      : false;

  for (const move of moves) {
    let score = Math.random() * 5;
    const movingPiece = state.board[move.from.row][move.from.col];
    const isMovingCaptain = Boolean(movingPiece?.isCaptain);
    const movingPieceValue = movingPiece?.value ?? 0;
    const isSumDiag = movingPiece?.type === "sumDiag";
    const simulatedState = simulateAction(state, move);

    if (move.type === "capture") {
      const targetPiece = state.board[move.to.row][move.to.col];
      if (targetPiece?.isCaptain) {
        score += 10000;
      } else if (targetPiece?.type === "sumDiag") {
        score += 130 + targetPiece.value * 5;
      } else if (targetPiece) {
        score += 50 + targetPiece.value * 10;
      }
    }

    if (captainPos && simulatedState) {
      const newCaptainPos = isMovingCaptain ? move.to : captainPos;
      const isThreatenedAfter = isPositionThreatened(
        simulatedState,
        newCaptainPos,
        state.currentPlayer,
      );

      if (isThreatenedAfter) {
        score -= 1000;
      } else if (isCaptainThreatenedNow) {
        score += 500;
      }

      if (!isMovingCaptain) {
        const distBefore = distance(move.from, captainPos);
        const distAfter = distance(move.to, captainPos);
        if (distBefore <= 1 && distAfter > 1) {
          score -= 15;
        }
      }
    }

    if (simulatedState && isPositionThreatened(simulatedState, move.to, state.currentPlayer)) {
      let penalty = 20 + movingPieceValue * 10;
      if (isSumDiag) {
        penalty *= 2;
      }
      score -= penalty;
    }

    if (!isMovingCaptain) {
      const progress =
        state.currentPlayer === 0
          ? move.to.row - move.from.row
          : move.from.row - move.to.row;
      if (progress > 0) {
        score += progress * 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) < 0.001) {
      bestMoves.push(move);
    }
  }

  return getRandomMove(bestMoves);
}

function simulateAction(
  state: MathWarState,
  action: MathWarAction,
): MathWarState | null {
  const result = applyAction(state, action, { nextDiceRoll: state.diceRoll });
  return result.ok ? result.state : null;
}

function isPositionThreatened(
  state: MathWarState,
  position: Position,
  owner: PlayerId,
): boolean {
  const opponent = owner === 0 ? 1 : 0;

  for (const { position: piecePosition } of getPlayerPieces(state, opponent)) {
    const moves = getLegalActionsForPiece(state, piecePosition, opponent);
    if (moves.some((move) => move.type === "capture" && samePosition(move.to, position))) {
      return true;
    }
  }

  return false;
}

function findCaptainPosition(
  state: MathWarState,
  player: PlayerId,
): Position | null {
  for (const { piece, position } of getPlayerPieces(state, player)) {
    if (piece.isCaptain) {
      return position;
    }
  }

  return null;
}

function samePosition(left: Position, right: Position): boolean {
  return left.row === right.row && left.col === right.col;
}

function distance(left: Position, right: Position): number {
  return Math.abs(left.row - right.row) + Math.abs(left.col - right.col);
}
