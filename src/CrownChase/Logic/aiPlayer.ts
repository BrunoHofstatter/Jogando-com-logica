import {
  applyAction,
  getLegalActions,
} from "./v2";
import type {
  CrownChaseAction,
  CrownChasePiece,
  CrownChaseState,
  PlayerId,
  Position,
} from "./v2";

export type AIDifficulty = 1 | 2 | 3 | 4 | 5;

export const getAIMove = (
  state: CrownChaseState,
  difficulty: AIDifficulty = 1,
): CrownChaseAction => {
  const availableMoves = getLegalActions(state);

  if (availableMoves.length === 0) {
    throw new Error("No available moves for AI");
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
};

const getRandomMove = (moves: CrownChaseAction[]): CrownChaseAction => {
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
};

const getDifficulty2Move = (
  state: CrownChaseState,
  moves: CrownChaseAction[],
): CrownChaseAction => {
  const captures = moves.filter((move) => move.type === "capture");
  if (captures.length > 0 && Math.random() < 0.8) {
    return captures[Math.floor(Math.random() * captures.length)];
  }

  const forwardMoves = moves.filter(
    (move) => move.to.row > move.from.row || move.to.col < move.from.col,
  );
  if (forwardMoves.length > 0 && Math.random() < 0.7) {
    return forwardMoves[Math.floor(Math.random() * forwardMoves.length)];
  }

  return getRandomMove(moves);
};

const getDifficulty3Move = (
  state: CrownChaseState,
  moves: CrownChaseAction[],
): CrownChaseAction => {
  let bestMove = moves[0];
  let maxScore = -Infinity;
  const enemyKingPos = findKingPosition(state, getOpponent(state.currentPlayer));
  const myKingPos = findKingPosition(state, state.currentPlayer);

  for (const move of moves) {
    const score = scoreMove(state, move, enemyKingPos, myKingPos);
    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

function scoreMove(
  state: CrownChaseState,
  move: CrownChaseAction,
  enemyKingPos: Position | null,
  myKingPos: Position | null,
): number {
  const simulated = applyAction(state, move);
  if (!simulated.ok) {
    return -Infinity;
  }

  let score = Math.random() * 10;
  const capturedPiece = state.board[move.to.row][move.to.col];

  if (move.type === "capture" && capturedPiece) {
    score += getPieceValue(capturedPiece) * 0.3;

    if (capturedPiece.type === "king") {
      score += 10000;
    }

    if (myKingPos && getDistance(move.to, myKingPos) <= 2) {
      score += 200;
    }
  }

  if (!isSquareSafe(simulated.state, move.to, state.currentPlayer) && move.type !== "capture") {
    score -= 50;
  }

  if (enemyKingPos) {
    score += Math.max(0, 6 - getDistance(move.to, enemyKingPos)) * 10;
  }

  return score;
}

function getDifficulty4Move(
  state: CrownChaseState,
  moves: CrownChaseAction[],
): CrownChaseAction {
  const depth = 3;
  let bestScore = -Infinity;
  let bestMoves: CrownChaseAction[] = [];

  for (const move of moves) {
    if (isWinningMove(state, move)) {
      return move;
    }
  }

  for (const move of moves) {
    const result = applyAction(state, move);
    if (!result.ok) {
      continue;
    }

    const score = minimax(result.state, depth - 1, -Infinity, Infinity, state.currentPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) < 5) {
      bestMoves.push(move);
    }
  }

  if (bestMoves.length === 0) {
    return getRandomMove(moves);
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function minimax(
  state: CrownChaseState,
  depth: number,
  alpha: number,
  beta: number,
  rootPlayer: PlayerId,
): number {
  if (state.status === "ended" || depth === 0) {
    return evaluateState(state, rootPlayer, depth);
  }

  const availableMoves = getLegalActions(state);
  if (availableMoves.length === 0) {
    return evaluateState(state, rootPlayer, depth);
  }

  const isMaximizing = state.currentPlayer === rootPlayer;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of availableMoves) {
      const result = applyAction(state, move);
      if (!result.ok) {
        continue;
      }

      const evalScore = minimax(result.state, depth - 1, alpha, beta, rootPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  }

  let minEval = Infinity;
  for (const move of availableMoves) {
    const result = applyAction(state, move);
    if (!result.ok) {
      continue;
    }

    const evalScore = minimax(result.state, depth - 1, alpha, beta, rootPlayer);
    minEval = Math.min(minEval, evalScore);
    beta = Math.min(beta, evalScore);
    if (beta <= alpha) {
      break;
    }
  }
  return minEval;
}

function evaluateState(
  state: CrownChaseState,
  rootPlayer: PlayerId,
  depth: number,
): number {
  if (state.status === "ended") {
    if (state.winner === rootPlayer) {
      return 100000 + depth;
    }
    if (state.winner === null) {
      return 0;
    }
    return -100000 - depth;
  }

  let score = 0;

  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < state.board[row].length; col++) {
      const piece = state.board[row][col];
      if (!piece) {
        continue;
      }

      const multiplier = piece.owner === rootPlayer ? 1 : -1;
      const pieceValue = getPieceValue(piece);

      score += pieceValue * multiplier;

      if (isPositionUnderAttack(state, { row, col }, piece.owner)) {
        if (piece.type === "king") {
          score -= 500 * multiplier;
        } else {
          score -= pieceValue * 0.9 * multiplier;
        }
      }

      if (piece.type === "killer" && row > 0 && row < 4 && col > 0 && col < 4) {
        score += 20 * multiplier;
      }
    }
  }

  return score;
}

function getPieceValue(piece: CrownChasePiece): number {
  switch (piece.type) {
    case "king":
      return 10000;
    case "killer":
      return 500;
    case "jumper":
      return 300;
    default:
      return 0;
  }
}

function isWinningMove(state: CrownChaseState, move: CrownChaseAction): boolean {
  const target = state.board[move.to.row][move.to.col];
  return move.type === "capture" && target?.type === "king" && target.owner !== state.currentPlayer;
}

function findKingPosition(
  state: CrownChaseState,
  owner: PlayerId,
): Position | null {
  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < state.board[row].length; col++) {
      const piece = state.board[row][col];
      if (piece?.type === "king" && piece.owner === owner) {
        return { row, col };
      }
    }
  }

  return null;
}

function getDistance(from: Position, to: Position): number {
  return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
}

function isSquareSafe(
  state: CrownChaseState,
  position: Position,
  owner: PlayerId,
): boolean {
  return !isPositionUnderAttack(state, position, owner);
}

function isPositionUnderAttack(
  state: CrownChaseState,
  targetPos: Position,
  owner: PlayerId,
): boolean {
  const enemyOwner = getOpponent(owner);

  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < state.board[row].length; col++) {
      const piece = state.board[row][col];
      if (piece?.owner !== enemyOwner) {
        continue;
      }

      if (canPieceAttack(state, { row, col }, targetPos, piece)) {
        return true;
      }
    }
  }

  return false;
}

function canPieceAttack(
  state: CrownChaseState,
  attackerPos: Position,
  targetPos: Position,
  attackerPiece: CrownChasePiece,
): boolean {
  const rowDiff = targetPos.row - attackerPos.row;
  const colDiff = targetPos.col - attackerPos.col;
  const distance = Math.abs(rowDiff) + Math.abs(colDiff);

  if (attackerPiece.type === "killer") {
    return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1 && distance > 0;
  }

  if (attackerPiece.type !== "jumper") {
    return false;
  }

  const isOrthogonalJump =
    (Math.abs(rowDiff) === 2 && colDiff === 0) ||
    (Math.abs(colDiff) === 2 && rowDiff === 0);

  if (!isOrthogonalJump) {
    return false;
  }

  const targetPiece = state.board[targetPos.row][targetPos.col];
  if (!targetPiece || targetPiece.type !== "king") {
    return false;
  }

  const middle = {
    row: attackerPos.row + rowDiff / 2,
    col: attackerPos.col + colDiff / 2,
  };

  return state.board[middle.row][middle.col] !== null;
}

function getOpponent(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}
