import { GameState, TurnAction, Position } from './types';
import { GameRules } from './types';

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
      return getDifficulty2Move(state, availableMoves, gameRules);
    case 3:
      return getDifficulty3Move(state, availableMoves, gameRules);
    case 4:
      return getDifficulty4Move(state, availableMoves, gameRules);
    default:
      return getRandomMove(availableMoves);
  }
};

/**
 * Level 1: Random move selection
 */
const getRandomMove = (moves: TurnAction[]): TurnAction => {
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
};

/**
 * Level 2: Prioritized Heuristics
 */
const getDifficulty2Move = (state: GameState, moves: TurnAction[], gameRules: GameRules): TurnAction => {
  // 1. Capture Logic (100% priority)
  const captures = moves.filter(m => m.type === 'capture');

  if (captures.length > 0) {
    const captainCaptures = captures.filter(m => {
      const target = state.board[m.to!.row][m.to!.col];
      return target?.data?.isCaptain;
    });

    if (captainCaptures.length > 0) {
      return captainCaptures[0];
    }
    return captures[Math.floor(Math.random() * captures.length)];
  }

  // 2. High Energy (>50% max energy) - 80% chance
  let candidates = [...moves];
  if (Math.random() < 0.8) {
    const highEnergyMoves = candidates.filter(m => {
      const cost = gameRules.calculateActionCost ? gameRules.calculateActionCost(state, m) : 0;
      const piece = state.board[m.from!.row][m.from!.col];
      const diceTotal = state.lastDiceRoll ? state.lastDiceRoll.reduce((sum, die) => sum + die, 0) : 0;
      const pieceEnergy = (piece?.value || 0) + diceTotal;
      return cost > (pieceEnergy / 2);
    });
    if (highEnergyMoves.length > 0) candidates = highEnergyMoves;
  }

  // 3. Forward Moves - 60% chance
  if (Math.random() < 0.6) {
    const forwardMoves = candidates.filter(m => m.to!.row > m.from!.row);
    if (forwardMoves.length > 0) candidates = forwardMoves;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * Level 3: Greedy Heuristics (Medium) - NEW
 * Evaluates basic captures and threats but doesn't simulate deep future states.
 * More aggressive but prone to traps.
 */
const getDifficulty3Move = (state: GameState, moves: TurnAction[], gameRules: GameRules): TurnAction => {
  let bestScore = -Infinity;
  let bestMoves: TurnAction[] = [];

  // Identify Captain
  let captainPos: Position | null = null;
  for (let r = 0; r < state.board.length; r++) {
    for (let c = 0; c < state.board[r].length; c++) {
      const piece = state.board[r][c];
      if (piece && piece.owner === state.currentPlayer && piece.data?.isCaptain) {
        captainPos = { row: r, col: c };
      }
    }
  }

  const isCaptainThreatenedNow = captainPos ? isPositionThreatened(state, captainPos, state.currentPlayer, gameRules) : false;

  for (const move of moves) {
    let score = Math.random() * 8; // More noise than Hard (0-8)

    const movingPiece = state.board[move.from!.row][move.from!.col];
    const isMovingCaptain = movingPiece?.data?.isCaptain;
    const movingPieceValue = movingPiece?.value || 0;
    const isSumDiag = movingPiece?.type === 'sumDiag';

    // --- 1. Captures (High Priority) ---
    if (move.type === 'capture') {
      // Look up piece on board
      const targetPiece = state.board[move.to!.row][move.to!.col];
      if (targetPiece) {
        if (targetPiece.data?.isCaptain) {
          score += 10000; // Win
        } else if (targetPiece.type === 'sumDiag') {
          score += 60 + (targetPiece.value || 0) * 5;
        } else {
          score += 40 + (targetPiece.value || 0) * 5;
        }
      }
    }

    // --- 2. Captain Safety (Reactive) ---
    // If captain is threatened, prioritize moves that might help (moving captain or capturing attacker)
    // This AI is simpler: it just strongly prefers moving the captain if it is threatened.
    if (isCaptainThreatenedNow) {
      const movingPiece = state.board[move.from!.row][move.from!.col];
      if (movingPiece?.data?.isCaptain) {
        score += 500; // RUN!
      } else if (move.type === 'capture') {
        // If we are capturing, maybe we are killing the threat? Bonus just in case.
        score += 100;
      }
    }

    const targetRow = state.currentPlayer === 0 ? 7 : 0;
    const progress = state.currentPlayer === 0 ? move.to!.row - move.from!.row : move.from!.row - move.to!.row;
    if (progress > 0) {
      score += progress * 0.2; // Reduced substantially to avoid mindless rushing
    }

    // --- 4. Sacrifice & Danger Analysis (Basic) ---
    // Added to prevent immediate suicide, which makes the AI look "dumb" rather than "medium".
    const simulatedState = cloneState(state);
    executeMoveSim(simulatedState, move);

    if (move.to && isPositionThreatened(simulatedState, move.to, state.currentPlayer, gameRules)) {
      let penalty = 20 + (movingPieceValue * 10);
      if (isSumDiag) penalty *= 2;
      score -= penalty;
    }

    // NO DEEP SIMULATION for self-preservation (Sacrifice Analysis skipped)
    // This makes it "Medium" - it will take a bait.

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) < 0.001) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};

/**
 * Level 4: Evaluated Heuristics (Hard)
 * Uses a point system to score every move based on captures, safety, and positioning.
 * Includes simulation to check destination safety.
 */
const getDifficulty4Move = (state: GameState, moves: TurnAction[], gameRules: GameRules): TurnAction => {
  let bestScore = -Infinity;
  let bestMoves: TurnAction[] = [];

  // Identify Captain
  let captainPos: Position | null = null;
  for (let r = 0; r < state.board.length; r++) {
    for (let c = 0; c < state.board[r].length; c++) {
      const piece = state.board[r][c];
      if (piece && piece.owner === state.currentPlayer && piece.data?.isCaptain) {
        captainPos = { row: r, col: c };
      }
    }
  }

  const isCaptainThreatenedNow = captainPos ? isPositionThreatened(state, captainPos, state.currentPlayer, gameRules) : false;

  for (const move of moves) {
    let score = Math.random() * 5; // Base noise (0-5)

    const movingPiece = state.board[move.from!.row][move.from!.col];
    const isMovingCaptain = movingPiece?.data?.isCaptain;
    const movingPieceValue = movingPiece?.value || 0;
    const isSumDiag = movingPiece?.type === 'sumDiag';

    // --- 1. Captures ---
    if (move.type === 'capture') {
      // Look up piece on board because move.capturedPiece might be incomplete
      const targetPiece = state.board[move.to!.row][move.to!.col];

      if (targetPiece) {
        if (targetPiece.data?.isCaptain) {
          score += 10000; // Win
        } else if (targetPiece.type === 'sumDiag') {
          score += 130 + (targetPiece.value || 0) * 5;
        } else {
          score += 50 + (targetPiece.value || 0) * 10;
        }
      }
    }

    // --- 2. Setup Capability (Capture next turn) ---
    // Simulating next turn potential requires simple lookahead, might be expensive.
    // Simplifying: Bonus if moving next to an enemy (that can't capture us back immediately)
    // For now, let's skip complex setup check to keep it fast, or do a simple checks

    // --- 3. Captain Safety ---
    if (captainPos) {
      // Simulate Move
      const simulatedState = cloneState(state);
      executeMoveSim(simulatedState, move);

      // Find new captain pos if it moved
      let newCaptainPos: Position = captainPos;
      if (isMovingCaptain && move.to) {
        newCaptainPos = move.to;
      }

      // Check immediate threat after move
      const isThreatenedAfter = isPositionThreatened(simulatedState, newCaptainPos, state.currentPlayer, gameRules);

      if (isThreatenedAfter) {
        score -= 1000; // Exposing captain
      } else if (isCaptainThreatenedNow) {
        score += 500; // Saved captain
      }

      // Uncovering Captain (Passive Protection)
      // If we were adjacent to captain, and move away (dist > 1 or further), and NOT moving captain
      if (!isMovingCaptain) {
        const distBefore = Math.abs(move.from!.row - captainPos.row) + Math.abs(move.from!.col - captainPos.col);
        const distAfter = Math.abs(move.to!.row - captainPos.row) + Math.abs(move.to!.col - captainPos.col);

        // If we were close (dist 1) and moved away
        if (distBefore <= 1 && distAfter > 1) {
          score -= 15;
        }
      }
    }

    // --- 4. Sacrifice & Danger Analysis ---
    // Check if destination is threatened by enemy
    // We already simulated the state above for captain safety, use it?
    // Note: isPositionThreatened calculates threats *against* a player.
    // If we move to `move.to`, we need to see if enemies can capture us there.
    // We reuse the simulation from Captain Safety if possible, but we need to do it if not done.

    // Optimization: Only simulate once per move
    const simulatedState = cloneState(state);
    executeMoveSim(simulatedState, move);

    if (move.to && isPositionThreatened(simulatedState, move.to, state.currentPlayer, gameRules)) {
      let penalty = 20 + (movingPieceValue * 10);
      if (isSumDiag) penalty *= 2;
      score -= penalty;
    }

    // --- 5. Strategic Positioning ---
    // Advance match: Closer to enemy backline (Row 7 for P0, Row 0 for P1)
    if (!isMovingCaptain) {
      const targetRow = state.currentPlayer === 0 ? 7 : 0;
      const progress = state.currentPlayer === 0 ? move.to!.row - move.from!.row : move.from!.row - move.to!.row;
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

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};

// --- Helpers ---

// Simple deep clone for simulation
const cloneState = (state: GameState): GameState => {
  // Deep clone board
  const newBoard = state.board.map(row =>
    row.map(p => p ? JSON.parse(JSON.stringify(p)) : null)
  );
  return {
    ...state,
    board: newBoard,
    // Shallow copy others is fine for move simulation usually, but be careful with reference types
    config: state.config, // Ref is fine
    players: state.players
  };
};

// Execute move on a cloned state (simplified, no full validation/events)
const executeMoveSim = (state: GameState, move: TurnAction) => {
  if (!move.from || !move.to) return;
  const piece = state.board[move.from.row][move.from.col];
  state.board[move.to.row][move.to.col] = piece;
  state.board[move.from.row][move.from.col] = null;
};

// Check if a specific position is under attack by any opponent piece
const isPositionThreatened = (
  state: GameState,
  pos: { row: number, col: number },
  owner: number,
  gameRules: GameRules
): boolean => {
  const opponent = owner === 0 ? 1 : 0;

  // Iterate all opponent pieces
  for (let r = 0; r < state.config.boardHeight; r++) {
    for (let c = 0; c < state.config.boardWidth; c++) {
      const piece = state.board[r][c];
      if (piece && piece.owner === opponent) {
        // Getting available actions for opponent piece
        // We can use gameRules.getAvailableActions but verify it inspects the passed 'state' state reliably
        // Since we are passing a simulated state, we need to ensure gameRules.getAvailableActions works on it.
        // It does, but we need to temporarily set currentPlayer or handle the owner check.
        // gameRules.getAvailableActions usually checks `state.currentPlayer`.

        // Hack: Temporarily set current player to opponent for the check?
        // Or manually check moves.

        const tempState = { ...state, currentPlayer: opponent };
        const moves = gameRules.getAvailableActions(tempState, { row: r, col: c });

        for (const m of moves) {
          if (m.type === 'capture' && m.to?.row === pos.row && m.to?.col === pos.col) {
            return true;
          }
        }
      }
    }
  }
  return false;
};
