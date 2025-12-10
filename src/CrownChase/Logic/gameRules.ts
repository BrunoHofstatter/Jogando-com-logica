import { GameConfig, GameRules, GameState, TurnAction, Position, Piece, WinResult } from './types';
import { GameUtils, MovementPatterns } from './types';
import { gameEngine } from './gameEngine';

export const gameRules: GameRules = {
validateMove: (state: GameState, action: TurnAction) => {
  // 1. Check if action has required positions
  if (!action.from || !action.to) return false;

  // 2. Basic validation (bounds, ownership, obstacles)
  if (!gameEngine.isValidBasicMove(state, action.from, action.to)) {
    return false;
  }

  // 3. Get the piece being moved
  const piece = gameEngine.getPieceAt(state, action.from);
  if (!piece || piece.owner !== state.currentPlayer) return false;

 
  // 4. Piece-specific validation
  switch (piece.type) {
    case 'king':
      // Kings cannot move
      return false;

    case 'killer':
      // Killers move 1 square in any direction
      const rowDiff = Math.abs(action.from.row - action.to.row);
      const colDiff = Math.abs(action.from.col - action.to.col);
      if (rowDiff > 1 || colDiff > 1) return false;
      break;

    case 'jumper':
      // Jumpers have two movement options
      const distance = MovementPatterns.distance(action.from, action.to);
      
      // Option 1: Regular orthogonal move (1 square)
      if (distance === 1) {
        if (!MovementPatterns.orthogonal(action.from, action.to)) return false;
      }
      // Option 2: Jump over a piece (2 squares)
      else if (distance === 2) {
        if (!MovementPatterns.orthogonal(action.from, action.to)) return false;
        
        // Check if there's a piece to jump over
        const midRow = (action.from.row + action.to.row) / 2;
        const midCol = (action.from.col + action.to.col) / 2;
        const middlePiece = gameEngine.getPieceAt(state, { row: midRow, col: midCol });
        
        if (!middlePiece) return false; // No piece to jump over
        
        // Check landing square - must be empty or enemy king
        const targetPiece = gameEngine.getPieceAt(state, action.to);
        if (targetPiece && (targetPiece.type !== 'king' || targetPiece.owner === state.currentPlayer)) {
          return false;
        }
      } else {
        return false; // Invalid distance
      }
      break;

    default:
      return false; // Unknown piece type
  }

  // 5. Check remaining moves
  if (state.remainingMoves <= 0) {
    return false;
  }

  // 6. Determine action type based on destination
  const targetPiece = gameEngine.getPieceAt(state, action.to);
  if (targetPiece) {
    // Enemy piece = capture
    if (targetPiece.owner !== state.currentPlayer) {
      // Special rules for jumper - can only capture kings
      if (piece.type === 'jumper' && targetPiece.type !== 'king') {
        return false;
      }
      action.type = 'capture';
    } else {
      return false; // Can't capture own pieces
    }
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

  // 3. Handle jumper jump move (special case)
  if (piece.type === 'jumper') {
    const distance = MovementPatterns.distance(action.from!, action.to!);
    
    // For jump moves (2 squares), we need to check if we're capturing a king
    if (distance === 2) {
      const targetPiece = state.board[action.to!.row][action.to!.col];
      
      // Only capture if landing on an enemy king
      if (targetPiece && targetPiece.type === 'king' && targetPiece.owner !== state.currentPlayer) {
        action.capturedPiece = targetPiece;
        action.type = 'capture';
      } else {
        // Regular jump (no capture)
        action.type = 'move';
      }
      
      // Move the piece regardless of capture
      state.board[action.to!.row][action.to!.col] = piece;
      state.board[action.from!.row][action.from!.col] = null;
      return true;
    }
  }

  // 4. Handle regular moves and captures for other pieces
  const targetPiece = state.board[action.to!.row][action.to!.col];
  if (targetPiece && targetPiece.owner !== state.currentPlayer) {
    // Store captured piece information
    action.capturedPiece = targetPiece;
    action.type = 'capture';
  }

  // 5. Move the piece to destination
  state.board[action.to!.row][action.to!.col] = piece;
  
  // 6. Clear the source position
  state.board[action.from!.row][action.from!.col] = null;

  return true;
},

  getAvailableActions: (state: GameState, position?: Position): TurnAction[] => {
  const actions: TurnAction[] = [];

  // Helper function to get moves for a specific piece
  const getMovesForPiece = (piecePos: Position): TurnAction[] => {
    const pieceMoves: TurnAction[] = [];
    const piece = state.board[piecePos.row][piecePos.col];
    
    if (!piece || piece.owner !== state.currentPlayer) {
      return pieceMoves;
    }

    // Generate moves based on piece type
    switch (piece.type) {
      case 'king':
        // Kings cannot move
        break;

      case 'killer':
        // Killer can move 1 square in any direction
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue; // Skip current position
            
            const targetPos = {
              row: piecePos.row + dr,
              col: piecePos.col + dc
            };
            
            // Check if position is valid
            if (GameUtils.isInBounds(targetPos, state.config.boardWidth, state.config.boardHeight)) {
              const action: TurnAction = {
                type: 'move', // Will be updated by validateMove
                from: piecePos,
                to: targetPos
              };
              
              if (gameRules.validateMove(state, action)) {
                pieceMoves.push(action);
              }
            }
          }
        }
        break;

      case 'jumper':
        // Jumper can move 1 square orthogonally or jump 2 squares orthogonally
        const directions = [
          { dr: -1, dc: 0 }, // Up
          { dr: 1, dc: 0 },  // Down
          { dr: 0, dc: -1 }, // Left
          { dr: 0, dc: 1 }   // Right
        ];
        
        for (const dir of directions) {
          // Regular move (1 square)
          const regularMovePos = {
            row: piecePos.row + dir.dr,
            col: piecePos.col + dir.dc
          };
          
          if (GameUtils.isInBounds(regularMovePos, state.config.boardWidth, state.config.boardHeight)) {
            const regularAction: TurnAction = {
              type: 'move',
              from: piecePos,
              to: regularMovePos
            };
            
            if (gameRules.validateMove(state, regularAction)) {
              pieceMoves.push(regularAction);
            }
          }
          
          // Jump move (2 squares)
          const jumpMovePos = {
            row: piecePos.row + (dir.dr * 2),
            col: piecePos.col + (dir.dc * 2)
          };
          
          if (GameUtils.isInBounds(jumpMovePos, state.config.boardWidth, state.config.boardHeight)) {
            const jumpAction: TurnAction = {
              type: 'move', // Will be updated by validateMove
              from: piecePos,
              to: jumpMovePos
            };
            
            if (gameRules.validateMove(state, jumpAction)) {
              pieceMoves.push(jumpAction);
            }
          }
        }
        break;
    }
    
    return pieceMoves;
  };

  // If a specific position is provided, get moves for that piece only
  if (position) {
    const piece = state.board[position.row][position.col];
    if (piece && piece.owner === state.currentPlayer) {
      const moves = getMovesForPiece(position);
      actions.push(...moves);
    }
  } else {
    // Get moves for all pieces of the current player
    for (let row = 0; row < state.config.boardHeight; row++) {
      for (let col = 0; col < state.config.boardWidth; col++) {
        const piece = state.board[row][col];
        if (piece && piece.owner === state.currentPlayer) {
          const moves = getMovesForPiece({ row, col });
          actions.push(...moves);
        }
      }
    }
  }

  return actions;
},

 checkWinCondition: (state: GameState): WinResult | null => {
  // Check if any king has been captured (game ends immediately when king is captured)
  let player0KingExists = false;
  let player1KingExists = false;

  // Scan the entire board to check if kings are still present
  for (let row = 0; row < state.config.boardHeight; row++) {
    for (let col = 0; col < state.config.boardWidth; col++) {
      const piece = state.board[row][col];
      if (piece && piece.type === 'king') {
        if (piece.owner === 0) {
          player0KingExists = true;
        } else if (piece.owner === 1) {
          player1KingExists = true;
        }
      }
    }
  }

  // Determine winner based on which king is missing
  if (!player0KingExists && !player1KingExists) {
    // Both kings captured (shouldn't happen in normal gameplay)
    return {
      winner: -1,
      reason: "Both kings have been captured - it's a draw!"
    };
  } else if (!player0KingExists) {
    // Player 0's king is captured - Player 1 wins
    return {
      winner: 1,
      reason: "Player 1 wins! Player 0's king has been captured."
    };
  } else if (!player1KingExists) {
    // Player 1's king is captured - Player 0 wins
    return {
      winner: 0,
      reason: "Player 0 wins! Player 1's king has been captured."
    };
  }

  // No winner yet - both kings are still on the board
  return null;
},
  onGameStart: (state: GameState): void => {
    // Initialize captured pieces tracking
    state.gameData.capturedPieces = [0, 0]; // [player0_captures, player1_captures]
  },

  onTurnStart: (state: GameState): void => {
    // Reset moves for the new turn
    state.remainingMoves = state.config.movesPerTurn;
  },


  onAfterAction: (state: GameState, action: TurnAction): void => {
    // Track captured pieces
    if (action.capturedPiece && action.type === 'capture') {
      const capturer = state.currentPlayer;
      if (!state.gameData.capturedPieces) {
        state.gameData.capturedPieces = [0, 0];
      }
      state.gameData.capturedPieces[capturer]++;
    }
  },



  shouldEndTurn: (state: GameState, action: TurnAction): boolean => {
    // In Crown Chase, each action ends the turn
    return true;
  },

  getActionsForPiece: function (state: GameState, position: Position): unknown {
    // This function should return piece-specific actions if needed
    return [];
  },

  shouldPromotePiece: function (state: GameState, piece: Piece, to: Position): unknown {
    // Crown Chase doesn't have piece promotion
    return false;
  }
};