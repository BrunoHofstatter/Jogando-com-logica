import { gameEngine } from './gameEngine';
import { GameConfig, GameRules, GameState, TurnAction, Position, Piece, WinResult } from './types';
import { GameUtils, MovementPatterns } from './types';

export const gameRules: GameRules = {
  validateMove: (state: GameState, action: TurnAction) => {
  // Check if action has required positions
  if (!action.from || !action.to) return false;

  // Basic validation (bounds, ownership, obstacles)
  if (!gameEngine.isValidBasicMove(state, action.from, action.to)) {
    return false;
  }

  const piece = gameEngine.getPieceAt(state, action.from);
  if (!piece || piece.owner !== state.currentPlayer) return false;

  // Get piece-specific energy from piece data
  const diceTotal = state.lastDiceRoll ? state.lastDiceRoll.reduce((sum, die) => sum + die, 0) : 0;
const pieceEnergy = diceTotal + (piece.value || 0);

// Update the piece's data with current energy
piece.data = {
  ...piece.data,
  pieceEnergy: pieceEnergy,
  diceTotal: diceTotal
};

// Also update state.remainingEnergy for UI display
state.remainingEnergy = pieceEnergy;

  // Math War specific: All pieces are Sum pieces (pawns) that move orthogonally
  if (piece.type !== 'sum') return false;

  // Check if move is orthogonal only (no diagonal moves allowed)
  if (!MovementPatterns.orthogonal(action.from, action.to)) {
    return false;
  }

  // Check path is clear (no jumping over pieces)
  const distance = MovementPatterns.distance(action.from, action.to);
  if (distance > 1) {
    const rowStep = action.to.row > action.from.row ? 1 : action.to.row < action.from.row ? -1 : 0;
    const colStep = action.to.col > action.from.col ? 1 : action.to.col < action.from.col ? -1 : 0;
    
    let currentPos = { row: action.from.row + rowStep, col: action.from.col + colStep };
    
    while (currentPos.row !== action.to.row || currentPos.col !== action.to.col) {
      if (gameEngine.getPieceAt(state, currentPos) !== null) {
        return false; // Path is blocked
      }
      currentPos = { 
        row: currentPos.row + rowStep, 
        col: currentPos.col + colStep 
      };
    }
  }

  // Check energy cost using our calculateActionCost function
  const cost = gameRules.calculateActionCost ? gameRules.calculateActionCost(state, action) : 1;
   
  // Use piece-specific energy
  if (cost > pieceEnergy) {
    return false;
  }

  // Determine action type based on destination
  const targetPiece = gameEngine.getPieceAt(state, action.to);
  if (targetPiece) {
    // Must be an enemy piece to capture
    if (targetPiece.owner === state.currentPlayer) {
      return false;
    }
    action.type = 'capture';
  } else {
    action.type = 'move';
  }

  return true;
},

  executeAction: (state: GameState, action: TurnAction): boolean => {
  // 1. Validate the action is still valid
  if (!gameRules.validateMove(state, action)) {
    return false;
  }

  // 2. Get the piece being moved
  const piece = state.board[action.from!.row][action.from!.col];
  if (!piece) return false;

  // 3. Handle capture if there's an enemy piece at destination
  const targetPiece = state.board[action.to!.row][action.to!.col];
  if (targetPiece && targetPiece.owner !== state.currentPlayer) {
    // Store captured piece information
    action.capturedPiece = targetPiece;
    action.type = 'capture';
    
    // Check if captured piece is the Captain (immediate win)
    if (targetPiece.data?.isCaptain) {
      // This will be handled by checkWinCondition
      action.data = { ...action.data, captainCaptured: true };
    }
  }

  // 4. Move the piece to destination
  state.board[action.to!.row][action.to!.col] = piece;
  
  // 5. Clear the source position
  state.board[action.from!.row][action.from!.col] = null;

  return true;
},

  getAvailableActions: (state: GameState, position?: Position): TurnAction[] => {
  const actions: TurnAction[] = [];

  const getPossibleMovesForPiece = (piecePosition: Position): TurnAction[] => {
    const moves: TurnAction[] = [];
    const piece = state.board[piecePosition.row][piecePosition.col];

    if (!piece || piece.owner !== state.currentPlayer) {
      return moves;
    }

    // Math War: All pieces move orthogonally in any direction
    // Generate moves in all 4 orthogonal directions
    const directions = [
      { row: -1, col: 0 },  // up
      { row: 1, col: 0 },   // down
      { row: 0, col: -1 },  // left
      { row: 0, col: 1 }    // right
    ];

    for (const direction of directions) {
      // Try different distances (1, 2, 3... squares) until we hit something or go out of bounds
      for (let distance = 1; distance <= Math.max(state.config.boardWidth, state.config.boardHeight); distance++) {
        const targetPos = {
          row: piecePosition.row + (direction.row * distance),
          col: piecePosition.col + (direction.col * distance)
        };

        // Check if target position is in bounds
        if (!GameUtils.isInBounds(targetPos, state.config.boardWidth, state.config.boardHeight)) {
          break; // Stop exploring this direction
        }

        // Create potential action
        const action: TurnAction = {
          type: 'move', // Will be updated to 'capture' by validateMove if needed
          from: piecePosition,
          to: targetPos
        };

        // Check if this move is valid
        if (gameRules.validateMove(state, action)) {
          moves.push(action);
          
          // If we captured something, stop exploring this direction
          if (action.type === 'capture') {
            break;
          }
        } else {
          // If move is invalid, stop exploring this direction
          // (probably hit a piece or ran out of energy)
          break;
        }
      }
    }

    return moves;
  };


  if (position) {
    // Get moves for specific piece
    const piece = state.board[position.row][position.col];
    if (piece && piece.owner === state.currentPlayer) {
      const moves = getPossibleMovesForPiece(position);
      actions.push(...moves);
    }
  } else {
    // Get all possible moves for current player
    for (let row = 0; row < state.config.boardHeight; row++) {
      for (let col = 0; col < state.config.boardWidth; col++) {
        const piece = state.board[row][col];
        if (piece && piece.owner === state.currentPlayer) {
          const moves = getPossibleMovesForPiece({ row, col });
          actions.push(...moves);
        }
      }
    }
  }

  return actions;
},

  checkWinCondition: (state: GameState): WinResult | null => {
  // 1. Check if a Captain was captured (immediate win)
  if (state.lastAction?.data?.captainCaptured) {
    const winner = state.currentPlayer; // Current player captured the captain
    return {
      winner,
      reason: `Player ${winner + 1} captured the opponent's Captain!`,
      immediate: true
    };
  }

  // Alternative check: Look for missing captains on the board
  const captainsOnBoard: number[] = [];
  for (let row = 0; row < state.config.boardHeight; row++) {
    for (let col = 0; col < state.config.boardWidth; col++) {
      const piece = state.board[row][col];
      if (piece && piece.data?.isCaptain) {
        if (!captainsOnBoard.includes(piece.owner)) {
          captainsOnBoard.push(piece.owner);
        }
      }
    }
  }

  // If a player's captain is missing, they lose
  for (let player = 0; player < state.players; player++) {
    if (!captainsOnBoard.includes(player)) {
      const winner = player === 0 ? 1 : 0; // Other player wins
      return {
        winner,
        reason: `Player ${player + 1}'s Captain was captured!`,
        immediate: true
      };
    }
  }


 

  // Game continues
  return null;
},
  getActionsForPiece: function (state: GameState, position: Position): unknown {
    throw new Error('Function not implemented.');
  },
  shouldPromotePiece: function (state: GameState, piece: Piece, to: Position): unknown {
    throw new Error('Function not implemented.');
  },
  calculateActionCost: (state: GameState, action: TurnAction): number => {
  if (!action.from || !action.to) return 0;
  
  const distance = MovementPatterns.distance(action.from, action.to);
  const baseCost = distance * 2; // 2 energy per orthogonal step
  
  // Add 2 extra energy for captures
  if (action.type === 'capture') {
    return baseCost + 2;
  }
  
  return baseCost;
},

shouldEndTurn: (state: GameState, action: TurnAction): boolean => {
  // In Math War, every move ends the turn (player can only move one piece per turn)
  return action.type === 'move' || action.type === 'capture';
},

onTurnStart: (state: GameState): void => {
  if (state.config.useDice) {
    // Only roll dice on Player 0's turn (every other turn)
    if (state.currentPlayer === 0) {
      state.lastDiceRoll = GameUtils.rollDice(2, 5);
    }
    // On Player 1's turn, keep the same dice roll from Player 0's turn
    
    // Reset energy to 0 - it will be calculated when pieces are selected
    state.remainingEnergy = 0;
  }
},

onGameStart: (state: GameState): void => {
  // Initialize captain selection for each player
  // Captains can only be assigned to back row pieces (row 0 for player 0, row 7 for player 1)
  for (let player = 0; player < state.players; player++) {
    const playerPieces = gameEngine.getPlayerPieces(state, player);
    
    // Filter pieces to only include back row pieces
    const backRowPieces = playerPieces.filter(({ position }) => {
      return (player === 0 && position.row === 0) || (player === 1 && position.row === 7);
    });
    
    if (backRowPieces.length > 0) {
      const randomIndex = Math.floor(Math.random() * backRowPieces.length);
      const captainPiece = backRowPieces[randomIndex].piece;
      captainPiece.data = { ...captainPiece.data, isCaptain: true };
    } else {
      // Fallback: if no back row pieces exist, use any piece (shouldn't happen in Math War)
      const randomIndex = Math.floor(Math.random() * playerPieces.length);
      const captainPiece = playerPieces[randomIndex].piece;
      captainPiece.data = { ...captainPiece.data, isCaptain: true };
    }
  }
  
  // Initialize game timer (30 minutes total)
  state.gameData.gameStartTime = Date.now();
  state.gameData.gameTimeLimit = 30 * 60 * 1000; // 30 minutes in milliseconds
},
};