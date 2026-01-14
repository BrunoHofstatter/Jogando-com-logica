import { UltimateBoard, BoardResult, Move, getAvailableMoves, checkWinner } from "./gameUtils";

export function getAIMove(
  boards: UltimateBoard,
  winners: Array<BoardResult>,
  activeBoard: number | null,
  difficulty: 1 | 2 | 3 | 4 = 1
): Move {
  const availableMoves = getAvailableMoves(boards, winners, activeBoard);

  if (availableMoves.length === 0) {
    throw new Error("No available moves for AI");
  }

  // Difficulty 4: Hard (Optimized Medium + Center focus - No Mistakes)
  if (difficulty === 4) {
    return getDifficulty4Move(boards, winners, availableMoves);
  }

  // Difficulty 3: Medium (Scoring System with Limited Lookahead)
  if (difficulty === 3) {
    return getDifficulty3Move(boards, winners, availableMoves);
  }

  // Difficulty 2: Easy (Win/Block 80% chance)
  if (difficulty === 2) {
    // 80% chance to take a winning move
    const winningMoves = availableMoves.filter((move) => {
      const board = boards[move.boardIndex];
      const newBoard = [...board];
      newBoard[move.cellIndex] = "O";
      return checkWinner(newBoard) === "O";
    });

    if (winningMoves.length > 0 && Math.random() < 0.8) {
      return winningMoves[Math.floor(Math.random() * winningMoves.length)];
    }

    // 80% chance to block an opponent's winning move
    const blockingMoves = availableMoves.filter((move) => {
      const board = boards[move.boardIndex];
      const newBoard = [...board];
      newBoard[move.cellIndex] = "X";
      return checkWinner(newBoard) === "X";
    });

    if (blockingMoves.length > 0 && Math.random() < 0.8) {
      return blockingMoves[Math.floor(Math.random() * blockingMoves.length)];
    }
  }

  // Level 1 (and fallback): Random Move
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
}

function getDifficulty3Move(
  boards: UltimateBoard,
  winners: Array<BoardResult>,
  availableMoves: Move[]
): Move {
  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  for (const move of availableMoves) {
    let score = evaluateMove(boards, winners, move, 3);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function getDifficulty4Move(
  boards: UltimateBoard,
  winners: Array<BoardResult>,
  availableMoves: Move[]
): Move {
  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  for (const move of availableMoves) {
    // Diff 4: Less noise, stricter values
    let score = evaluateMove(boards, winners, move, 4);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// Shared evaluation logic
function evaluateMove(boards: UltimateBoard, winners: Array<BoardResult>, move: Move, difficulty: 3 | 4): number {
  let score = 0;
  const boardIndex = move.boardIndex;
  const currentBoard = boards[boardIndex];

  // --- 1. Small Board Strategy ---

  // Check if move wins the small board
  const boardWithMove = [...currentBoard];
  boardWithMove[move.cellIndex] = "O";
  const winsBoard = checkWinner(boardWithMove) === "O";

  if (winsBoard) {
    score += 1000;
    // --- 2. Big Board Strategy (only if we win this board) ---
    const newWinners = [...winners];
    newWinners[boardIndex] = "O";

    // Check if this victory wins the entire game (Big Board Line)
    if (checkBigLine(newWinners, "O")) {
      score += 5000;
    }

    // Check if this blocks opponents Big Board line
    const oppWinners = [...winners];
    oppWinners[boardIndex] = "X";
    if (checkBigLine(oppWinners, "X")) {
      score += 4000;
    }

    // Difficulty 4: Center Board Bonus
    if (difficulty === 4 && boardIndex === 4) {
      score += 300; // Center is valuable on big board
    }
  }

  // Check if move blocks opponent from winning small board
  const boardWithOppMove = [...currentBoard];
  boardWithOppMove[move.cellIndex] = "X";
  if (checkWinner(boardWithOppMove) === "X") {
    score += 800;
    // Check if blocking this prevents opponent Big Board win
    const oppWinners = [...winners];
    oppWinners[boardIndex] = "X";
    if (checkBigLine(oppWinners, "X")) {
      score += 3000;
    }
  }

  // Difficulty 4: Setup (Threats)
  // If not winning or blocking, does it create 2 in a row on the small board?
  // Simplified: Add points for "Center" of small board if available
  if (difficulty === 4 && !winsBoard && currentBoard[4] === null && move.cellIndex === 4) {
    score += 50;
  }


  // --- 3. Safety Check (Look-ahead) ---
  // Where does this move send the opponent?

  let targetBoardIndex = move.cellIndex;

  // Check if target board allows opponent free move (board won or full)

  // Check state of target board
  // Note: winners array won't be updated yet with our potential win above, so we check carefully
  const targetIsFullOrWon = winners[targetBoardIndex] !== null || (winsBoard && targetBoardIndex === boardIndex);

  if (targetIsFullOrWon) {
    // Giving free move penalty
    // Diff 3: -30, Diff 4: -200 (Huge penalty, don't give free moves unless winning game)
    score -= difficulty === 4 ? 200 : 30;
  } else {
    // Opponent is sent to specific target board
    const targetBoard = boards[targetBoardIndex];
    const canOpponentWinTarget = canWinBoard(targetBoard, "X");

    if (canOpponentWinTarget) {
      // Safety Check Probability
      const safetyChance = difficulty === 4 ? 1.0 : 0.5; // Diff 4: Always see it. Diff 3: 50%

      if (Math.random() < safetyChance) {
        score -= 2000;
      }
    }
  }

  // Noise
  const noise = difficulty === 4 ? 5 : 20; // Less noise in hard mode
  score += Math.random() * noise;

  return score;
}

// Helper to check if a player has a winning line on the big board winners array
function checkBigLine(winners: Array<BoardResult>, player: "X" | "O"): boolean {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6] // diagonals
  ];
  return lines.some(line => line.every(idx => winners[idx] === player));
}

// Helper to check if player can win a specific board in one move
function canWinBoard(board: import("./gameUtils").MiniBoard, player: "X" | "O"): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const tempBoard = [...board];
      tempBoard[i] = player;
      if (checkWinner(tempBoard) === player) return true;
    }
  }
  return false;
}
