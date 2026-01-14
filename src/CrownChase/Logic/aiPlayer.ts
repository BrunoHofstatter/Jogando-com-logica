import { GameState, TurnAction } from '../../AA_baseGame/Logic/types';
import { GameRules } from '../../AA_baseGame/Logic/types';

export type AIDifficulty = 1 | 2 | 3 | 4 | 5;

/**
 * Get the AI's move based on difficulty level
 * @param state Current game state
 * @param gameRules Game rules for getting available actions
 * @param difficulty AI difficulty level (1 = Easy/Random)
 * @returns The selected action for the AI to execute
 */
export const getAIMove = (
  state: GameState,
  gameRules: GameRules,
  difficulty: AIDifficulty = 1
): TurnAction => {
  const availableMoves = gameRules.getAvailableActions(state);

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
      return getDifficulty4Move(state, availableMoves, gameRules); // Minimax Difficulty
    default:
      return getRandomMove(availableMoves);
  }
};

// --- Difficulty 1 & 2 (Simple) ---

const getRandomMove = (moves: TurnAction[]): TurnAction => {
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
};

const getDifficulty2Move = (state: GameState, moves: TurnAction[]): TurnAction => {
  const captures = moves.filter(m => m.type === 'capture');
  if (captures.length > 0 && Math.random() < 0.8) {
    return captures[Math.floor(Math.random() * captures.length)];
  }
  const forwardMoves = moves.filter(m => {
    if (!m.from || !m.to) return false;
    return m.to.row > m.from.row || m.to.col < m.from.col; // Simple forward heuristic
  });
  if (forwardMoves.length > 0 && Math.random() < 0.7) {
    return forwardMoves[Math.floor(Math.random() * forwardMoves.length)];
  }
  return getRandomMove(moves);
};

// --- Difficulty 3 (Heuristic) ---

const getDifficulty3Move = (state: GameState, moves: TurnAction[]): TurnAction => {
  let bestMove = moves[0];
  let maxScore = -Infinity;
  const enemyKingPos = findKingPosition(state, state.currentPlayer === 0 ? 1 : 0);
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
  state: GameState,
  move: TurnAction,
  enemyKingPos: { row: number, col: number } | null,
  myKingPos: { row: number, col: number } | null
): number {
  let score = Math.random() * 10;
  if (move.type === 'capture') {
    // Scoring logic for D3...
    let capturedPiece = move.capturedPiece;
    if (!capturedPiece && move.to) {
      const p = state.board[move.to.row][move.to.col];
      if (p && p.owner !== state.currentPlayer) capturedPiece = p;
    }
    if (capturedPiece) {
      switch (capturedPiece.type) {
        case 'king': score += 10000; break;
        case 'killer': score += 150; break;
        case 'jumper': score += 100; break;
        default: score += 50;
      }
      if (myKingPos && move.to) {
        if (getDistance(move.to, myKingPos) <= 2) score += 200;
      }
    }
  }
  if (move.to && !isSquareSafe(state, move.to, state.currentPlayer)) {
    if (move.type !== 'capture') score -= 50;
  }
  return score;
}

// --- Difficulty 4 (Minimax) ---

function getDifficulty4Move(state: GameState, moves: TurnAction[], gameRules: GameRules): TurnAction {
  // Config
  const DEPTH = 2; // Lookahead: 1 (my move) + 1 (enemy response)
  const NOISE_FACTOR = 0.1; // 10% randomness to weaken perfect play

  let bestScore = -Infinity;
  let bestMoves: TurnAction[] = [];

  // If we have a winning move immediately (Capture King), take it!
  // This is a "Depth 1" check that overrides everything because Minimax might
  // sometimes undervalue a win if it sees a "better" win later (unlikely but safe).
  for (const move of moves) {
    if (isWinningMove(state, move)) return move;
  }

  // Minimax Loop
  for (const move of moves) {
    const simulatedState = cloneState(state);
    executeMoveSim(simulatedState, move);

    // Switch turn for the simulation
    const nextPlayer = state.currentPlayer === 0 ? 1 : 0;
    simulatedState.currentPlayer = nextPlayer;

    // Call Minimax (Minimizing for enemy)
    // We pass -Infinity, Infinity for Alpha/Beta
    let score = minimax(simulatedState, DEPTH - 1, false, -Infinity, Infinity, gameRules, state.currentPlayer);

    // Add User-Requested Weakening Noise
    // Score is typically in hundreds/thousands. 
    // We modify it by +/- 10% of its absolute value + some flat noise.
    if (score !== Infinity && score !== -Infinity) {
      const noise = (Math.random() - 0.5) * (Math.abs(score) * NOISE_FACTOR + 20);
      score += noise;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) < 5) { // Treat close scores as equal
      bestMoves.push(move);
    }
  }

  // Pick random from best (or tied) moves
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function minimax(
  state: GameState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  gameRules: GameRules,
  rootPlayer: number // The player who started the search (The AI)
): number {

  // Terminal State Checks (King Capture / No Moves)
  const enemyOfRoot = rootPlayer === 0 ? 1 : 0;
  const aiKing = findKingPosition(state, rootPlayer);
  const enemyKing = findKingPosition(state, enemyOfRoot);

  if (!aiKing) return -100000; // AI Lost
  if (!enemyKing) return 100000; // AI Won

  if (depth === 0) {
    return evaluateState(state, rootPlayer);
  }

  const availableMoves = gameRules.getAvailableActions(state);
  if (availableMoves.length === 0) {
    // Stalemate or Loss depending on rules? Assuming loss if cant move or just neutral
    return -50000;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of availableMoves) {
      const nextState = cloneState(state);
      executeMoveSim(nextState, move);
      // Switch turn
      nextState.currentPlayer = state.currentPlayer === 0 ? 1 : 0;

      const evalScore = minimax(nextState, depth - 1, false, alpha, beta, gameRules, rootPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of availableMoves) {
      const nextState = cloneState(state);
      executeMoveSim(nextState, move);
      // Switch turn
      nextState.currentPlayer = state.currentPlayer === 0 ? 1 : 0;

      const evalScore = minimax(nextState, depth - 1, true, alpha, beta, gameRules, rootPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Static Evaluation Function
 * Returns a score representing how good the state is for the `rootPlayer`.
 */
function evaluateState(state: GameState, rootPlayer: number): number {
  let score = 0;
  const enemyPlayer = rootPlayer === 0 ? 1 : 0;

  for (let r = 0; r < state.config.boardHeight; r++) {
    for (let c = 0; c < state.config.boardWidth; c++) {
      const piece = state.board[r][c];
      if (!piece) continue;

      const isMe = piece.owner === rootPlayer;
      const multiplier = isMe ? 1 : -1;

      // 1. Material
      let value = 0;
      if (piece.type === 'king') value = 10000;
      else if (piece.type === 'killer') value = 500;
      else if (piece.type === 'jumper') value = 300;

      score += value * multiplier;

      // 2. Safety (Am I under attack?)
      // Note: This is computationally expensive, but board is small (5x5)
      // Ideally we pass threats down, but re-scanning here is fine for valid Depth 0
      if (isPositionUnderAttack(state, { row: r, col: c }, piece.owner)) {
        // If it's the King, huge penalty (Check) -> but not as big as losing king
        if (piece.type === 'king') {
          score -= 500 * multiplier; // "Check" penalty
        } else {
          // Piece under threat
          score -= (value * 0.5) * multiplier; // Risking half the piece's value
        }
      }

      // 3. Positional / Aggression
      // Reward advancing Killers slightly
      if (piece.type === 'killer') {
        // Simple center control / advance bonus
        if (r > 0 && r < 4 && c > 0 && c < 4) score += 20 * multiplier;
      }
    }
  }
  return score;
}

// --- Common Helpers ---

function cloneState(state: GameState): GameState {
  const newBoard = state.board.map(row => row.map(p => p ? { ...p } : null));
  return { ...state, board: newBoard, currentPlayer: state.currentPlayer }; // Deep clone board
}

function executeMoveSim(state: GameState, move: TurnAction) {
  if (!move.from || !move.to) return;
  const piece = state.board[move.from.row][move.from.col];
  state.board[move.to.row][move.to.col] = piece;
  state.board[move.from.row][move.from.col] = null;

  // Handle Capture (Remove piece logic handled by overwrite)
  // Crown Chase doesn't have complex move logic besides jump/step capture
}

function isWinningMove(state: GameState, move: TurnAction): boolean {
  if (move.type === 'capture' && move.capturedPiece?.type === 'king') return true;
  // Also check destination if capturePiece isn't set (sometimes logic differs)
  if (move.to) {
    const target = state.board[move.to.row][move.to.col];
    if (target && target.type === 'king' && target.owner !== state.currentPlayer) return true;
  }
  return false;
}

function findKingPosition(state: GameState, owner: number): { row: number, col: number } | null {
  for (let r = 0; r < state.config.boardHeight; r++) {
    for (let c = 0; c < state.config.boardWidth; c++) {
      const p = state.board[r][c];
      if (p && p.type === 'king' && p.owner === owner) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function getDistance(p1: { row: number, col: number }, p2: { row: number, col: number }) {
  return Math.abs(p1.row - p2.row) + Math.abs(p1.col - p2.col);
}

function isSquareSafe(state: GameState, pos: { row: number, col: number }, myOwner: number): boolean {
  return !isPositionUnderAttack(state, pos, myOwner);
}

// Used by both Minimax (Eval) and D3
function isPositionUnderAttack(state: GameState, targetPos: { row: number, col: number }, myOwner: number): boolean {
  const enemyOwner = myOwner === 0 ? 1 : 0;
  for (let r = 0; r < state.config.boardHeight; r++) {
    for (let c = 0; c < state.config.boardWidth; c++) {
      const piece = state.board[r][c];
      if (piece && piece.owner === enemyOwner) {
        if (canPieceAttack(state, { row: r, col: c }, targetPos, piece)) {
          return true;
        }
      }
    }
  }
  return false;
}

function canPieceAttack(state: GameState, attackerPos: { row: number, col: number }, targetPos: { row: number, col: number }, attackerPiece: any): boolean {
  const dr = targetPos.row - attackerPos.row;
  const dc = targetPos.col - attackerPos.col;
  const dist = Math.abs(dr) + Math.abs(dc);

  if (attackerPiece.type === 'killer') {
    return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && dist > 0;
  }

  if (attackerPiece.type === 'jumper') {
    if ((Math.abs(dr) === 2 && dc === 0) || (Math.abs(dc) === 2 && dr === 0)) {
      const midR = attackerPos.row + dr / 2;
      const midC = attackerPos.col + dc / 2;

      // Jumper can ONLY attack Kings
      const targetPiece = state.board[targetPos.row][targetPos.col];
      const isTargetKing = targetPiece && targetPiece.type === 'king';
      if (!isTargetKing) return false;

      // Must be jumping over something
      if (state.board[midR][midC] !== null) {
        return true;
      }
    }
  }
  return false;
}
