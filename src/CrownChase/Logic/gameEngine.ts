import {
  GameState,
  GameConfig,
  GameRules,
  TurnAction,
  Position,
  Piece,
  InitialPieceSetup,
  WinResult,
  GameEvent,
  GameEventHandler,
  GameUtils
} from "./types";

export class GameEngine {
  private eventHandlers: GameEventHandler[] = [];

  // Initialize game state from config
  initializeGame(config: GameConfig, rules: GameRules): GameState {
    // Create empty board
    const board: (Piece | null)[][] = Array.from({ length: config.boardHeight }, () =>
      Array.from({ length: config.boardWidth }, () => null)
    );

    // Place initial pieces and obstacles
    for (const setup of config.initialSetup) {
      const piece: Piece = {
        id: `${setup.type}-${setup.row}-${setup.col}`,
        type: setup.type,
        owner: setup.owner,
        value: setup.value,
        data: setup.data || {},
        isObstacle: setup.isObstacle || false
      };
      board[setup.row][setup.col] = piece;
    }

    const state: GameState = {
      board,
      currentPlayer: 1,
      turnCount: 0,
      players: config.players,
      config,
      gamePhase: "playing",
      winner: null,
      remainingMoves: config.movesPerTurn,
      remainingEnergy: config.energyPerTurn,
      gameData: {},
      playerData: this.initializePlayerData(config),
      actionHistory: []
    };

    // Call game-specific initialization
    rules.onGameStart?.(state);
    rules.onTurnStart?.(state);

    this.emitEvent({ type: "turn_start", data: { player: state.currentPlayer } });

    return state;
  }

  // Execute a turn action
  executeAction(state: GameState, action: TurnAction, rules: GameRules): boolean {
    if (state.gamePhase !== "playing") {
      this.emitEvent({ type: "invalid_action", data: "Game has ended" });
      return false;
    }

    // Handle dice roll action
    if (action.type === "roll_dice" && state.config.useDice) {
      const diceCount = state.config.diceCount || 3;
      const diceSides = state.config.diceSides || 6;
      state.lastDiceRoll = GameUtils.rollDice(diceCount, diceSides);
      this.emitEvent({ type: "dice_rolled", data: { dice: state.lastDiceRoll } });
      return true;
    }

    // Validate the action
    if (!rules.validateMove(state, action)) {
      this.emitEvent({ type: "invalid_action", data: "Invalid move" });
      return false;
    }

    // Calculate and check action cost
    let cost = 1;
    if (rules.calculateActionCost) {
      cost = rules.calculateActionCost(state, action);
      action.cost = cost;
    }

    // Check if player has enough moves/energy
    if (state.config.energyPerTurn !== undefined) {
      if (cost > (state.remainingEnergy || 0)) {
        this.emitEvent({ type: "invalid_action", data: "Not enough energy remaining" });
        return false;
      }
    } else {
      if (cost > state.remainingMoves) {
        this.emitEvent({ type: "invalid_action", data: "Not enough moves remaining" });
        return false;
      }
    }

    // Execute the action through game rules
    const success = rules.executeAction(state, action);
    if (!success) {
      this.emitEvent({ type: "invalid_action", data: "Action execution failed" });
      return false;
    }

    // Update game state
    state.lastAction = action;
    state.actionHistory.push(action);

    // Deduct move cost
    if (state.config.energyPerTurn !== undefined) {
      state.remainingEnergy = (state.remainingEnergy || 0) - cost;
    } else {
      state.remainingMoves -= cost;
    }

    this.emitEvent({ type: "action_executed", data: action });

    // Call after-action hook for games that need it (like Passagem's surrounding capture)
    rules.onAfterAction?.(state, action);

    // Check win condition after action
    const winResult = rules.checkWinCondition(state);
    if (winResult) {
      this.endGame(state, winResult);
      return true;
    }

    // Check if turn should end
    const shouldEnd = rules.shouldEndTurn?.(state, action) ?? 
      (state.config.energyPerTurn !== undefined ? (state.remainingEnergy || 0) <= 0 : state.remainingMoves <= 0);
    
    if (shouldEnd) {
      this.endTurn(state, rules);
    }

    return true;
  }

  // Get all available actions for current player
  getAvailableActions(state: GameState, rules: GameRules, position?: Position): TurnAction[] {
    if (state.gamePhase !== "playing") {
      return [];
    }
    
    const actions = rules.getAvailableActions(state, position);
    
    // Filter actions that exceed remaining moves/energy
    return actions.filter(action => {
      if (rules.calculateActionCost) {
        const cost = rules.calculateActionCost(state, action);
        if (state.config.energyPerTurn !== undefined) {
          return cost <= (state.remainingEnergy || 0);
        } else {
          return cost <= state.remainingMoves;
        }
      }
      
      if (state.config.energyPerTurn !== undefined) {
        return (state.remainingEnergy || 0) > 0;
      } else {
        return state.remainingMoves > 0;
      }
    });
  }

  // Basic move validation (bounds and ownership)
  isValidBasicMove(state: GameState, from: Position, to: Position, canCapture: boolean = true): boolean {
    // Check bounds
    if (!GameUtils.isInBounds(to, state.config.boardWidth, state.config.boardHeight)) {
      return false;
    }

    // Check if piece exists and belongs to current player
    const piece = state.board[from.row][from.col];
    if (!piece || piece.owner !== state.currentPlayer || piece.isObstacle) {
      return false;
    }

    // Check if destination is not occupied by own piece or obstacle
    const targetPiece = state.board[to.row][to.col];
    if (targetPiece) {
      if (targetPiece.owner === state.currentPlayer || targetPiece.isObstacle) {
        return false;
      }
      if (!canCapture) {
        return false;
      }
    }

    return true;
  }

  // Execute basic move (replace piece)
  executeBasicMove(state: GameState, action: TurnAction, canCapture: boolean = true): boolean {
    if (!action.from || !action.to) return false;

    const piece = state.board[action.from.row][action.from.col];
    if (!piece) return false;

    // Store captured piece if any
    const capturedPiece = state.board[action.to.row][action.to.col];
    if (capturedPiece && canCapture) {
      action.capturedPiece = capturedPiece;
      action.type = "capture";
      this.emitEvent({ type: "piece_captured", data: { piece: capturedPiece, position: action.to } });
    }

    // Move the piece
    state.board[action.to.row][action.to.col] = piece;
    state.board[action.from.row][action.from.col] = null;

    return true;
  }

  // Execute jump move (jump over allied piece)
  executeJumpMove(state: GameState, action: TurnAction, canCapture: boolean = true): boolean {
    if (!action.from || !action.to) return false;

    const piece = state.board[action.from.row][action.from.col];
    if (!piece) return false;

    // Calculate middle position (the piece being jumped over)
    const midRow = action.from.row + Math.sign(action.to.row - action.from.row);
    const midCol = action.from.col + Math.sign(action.to.col - action.from.col);
    const midPosition = { row: midRow, col: midCol };

    // Check if there's a piece to jump over
    const jumpedPiece = state.board[midRow][midCol];
    if (!jumpedPiece || jumpedPiece.owner !== state.currentPlayer) {
      return false;
    }

    // Store captured piece if any
    const capturedPiece = state.board[action.to.row][action.to.col];
    if (capturedPiece && canCapture) {
      action.capturedPiece = capturedPiece;
      action.type = "capture";
      this.emitEvent({ type: "piece_captured", data: { piece: capturedPiece, position: action.to } });
    }

    // Move the piece
    state.board[action.to.row][action.to.col] = piece;
    state.board[action.from.row][action.from.col] = null;

    return true;
  }

  // Place a barrier or piece on the board
  executePlaceAction(state: GameState, action: TurnAction): boolean {
    if (!action.to || !action.piece) return false;

    // Check if position is empty
    if (state.board[action.to.row][action.to.col] !== null) {
      return false;
    }

    // Place the piece/barrier
    state.board[action.to.row][action.to.col] = action.piece;
    
    if (action.piece.isObstacle) {
      this.emitEvent({ type: "barrier_placed", data: { position: action.to, piece: action.piece } });
    }
    
    return true;
  }

  // Promote a piece (increase its value)
  executePromoteAction(state: GameState, action: TurnAction): boolean {
    if (!action.to) return false;

    const piece = state.board[action.to.row][action.to.col];
    if (!piece) return false;

    // Increase piece value
    if (piece.value !== undefined) {
      piece.value += action.data?.valueIncrease || 4;
      this.emitEvent({ type: "piece_promoted", data: { piece, newValue: piece.value } });
      return true;
    }

    return false;
  }

  // End current turn and start next
  private endTurn(state: GameState, rules: GameRules): void {
    // Call game-specific turn end
    rules.onTurnEnd?.(state);

    this.emitEvent({ type: "turn_end", data: { player: state.currentPlayer } });

    // Switch to next player
    state.currentPlayer = (state.currentPlayer + 1) % state.players;
    state.turnCount++;

    // Reset turn resources
    state.remainingMoves = state.config.movesPerTurn;
    state.remainingEnergy = state.config.energyPerTurn;

    // Call game-specific turn start
    rules.onTurnStart?.(state);

    this.emitEvent({ type: "turn_start", data: { player: state.currentPlayer } });
  }

  // End the game
  private endGame(state: GameState, winResult: WinResult): void {
    state.gamePhase = "ended";
    state.winner = winResult.winner;
    
    this.emitEvent({ 
      type: "win", 
      data: { 
        winner: winResult.winner, 
        reason: winResult.reason 
      } 
    });
  }

  // Validate game state integrity
  validateGameState(state: GameState): boolean {
    // Check board dimensions
    if (state.board.length !== state.config.boardHeight) return false;
    if (state.board[0]?.length !== state.config.boardWidth) return false;

    // Check current player bounds
    if (state.currentPlayer < 0 || state.currentPlayer >= state.players) return false;

    // Check piece ownership
    for (let row = 0; row < state.config.boardHeight; row++) {
      for (let col = 0; col < state.config.boardWidth; col++) {
        const piece = state.board[row][col];
        if (piece && !piece.isObstacle && (piece.owner < 0 || piece.owner >= state.players)) {
          return false;
        }
      }
    }

    return true;
  }

  // Clone game state for undo/redo or AI simulation
  cloneGameState(state: GameState): GameState {
    return {
      board: GameUtils.cloneBoard(state.board),
      currentPlayer: state.currentPlayer,
      turnCount: state.turnCount,
      players: state.players,
      config: state.config,
      gamePhase: state.gamePhase,
      winner: state.winner,
      remainingMoves: state.remainingMoves,
      remainingEnergy: state.remainingEnergy,
      gameData: { ...state.gameData },
      playerData: JSON.parse(JSON.stringify(state.playerData)),
      lastAction: state.lastAction ? { ...state.lastAction } : undefined,
      actionHistory: [...state.actionHistory],
      lastDiceRoll: state.lastDiceRoll ? [...state.lastDiceRoll] : undefined
    };
  }

  // Timer management
  startTurnTimer(state: GameState, onTimeout: () => void): NodeJS.Timeout | null {
    if (!state.config.turnTimeLimit) return null;

    return setTimeout(() => {
      if (state.gamePhase === "playing") {
        onTimeout();
      }
    }, state.config.turnTimeLimit * 1000);
  }

  // Event system for UI integration
  addEventListener(handler: GameEventHandler): void {
    this.eventHandlers.push(handler);
  }

  removeEventListener(handler: GameEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  private emitEvent(event: GameEvent): void {
    this.eventHandlers.forEach(handler => handler(event));
  }

  // Helper methods for common operations
  getPieceAt(state: GameState, position: Position): Piece | null {
    if (!GameUtils.isInBounds(position, state.config.boardWidth, state.config.boardHeight)) {
      return null;
    }
    return state.board[position.row][position.col];
  }

  setPieceAt(state: GameState, position: Position, piece: Piece | null): boolean {
    if (!GameUtils.isInBounds(position, state.config.boardWidth, state.config.boardHeight)) {
      return false;
    }
    state.board[position.row][position.col] = piece;
    return true;
  }

  getPlayerPieces(state: GameState, player: number): { piece: Piece, position: Position }[] {
    const pieces: { piece: Piece, position: Position }[] = [];
    
    for (let row = 0; row < state.config.boardHeight; row++) {
      for (let col = 0; col < state.config.boardWidth; col++) {
        const piece = state.board[row][col];
        if (piece && !piece.isObstacle && piece.owner === player) {
          pieces.push({ piece, position: { row, col } });
        }
      }
    }
    
    return pieces;
  }

  // Count pieces by type or player
  countPieces(state: GameState, filter?: { owner?: number, type?: string }): number {
    let count = 0;
    
    for (let row = 0; row < state.config.boardHeight; row++) {
      for (let col = 0; col < state.config.boardWidth; col++) {
        const piece = state.board[row][col];
        if (piece && !piece.isObstacle) {
          if (filter?.owner !== undefined && piece.owner !== filter.owner) continue;
          if (filter?.type !== undefined && piece.type !== filter.type) continue;
          count++;
        }
      }
    }
    
    return count;
  }

  // Check if a position is surrounded for Passagem's capture mechanic
  isPositionSurrounded(state: GameState, position: Position, goalDirection: string): boolean {
    const piece = this.getPieceAt(state, position);
    if (!piece || piece.isObstacle) return false;

    // Determine which sides to check based on goal direction
    let front, left, right;
    
    if (goalDirection === "up") {
      front = { row: position.row - 1, col: position.col };
      left = { row: position.row, col: position.col - 1 };
      right = { row: position.row, col: position.col + 1 };
    } else if (goalDirection === "down") {
      front = { row: position.row + 1, col: position.col };
      left = { row: position.row, col: position.col - 1 };
      right = { row: position.row, col: position.col + 1 };
    } else if (goalDirection === "left") {
      front = { row: position.row, col: position.col - 1 };
      left = { row: position.row + 1, col: position.col };
      right = { row: position.row - 1, col: position.col };
    } else { // right
      front = { row: position.row, col: position.col + 1 };
      left = { row: position.row - 1, col: position.col };
      right = { row: position.row + 1, col: position.col };
    }

    // Check if all three sides are blocked by enemy pieces, barriers, or board edges
    const isFrontBlocked = !GameUtils.isInBounds(front, state.config.boardWidth, state.config.boardHeight) || 
      (this.getPieceAt(state, front)?.owner !== piece.owner && this.getPieceAt(state, front) !== null);
    
    const isLeftBlocked = !GameUtils.isInBounds(left, state.config.boardWidth, state.config.boardHeight) || 
      (this.getPieceAt(state, left)?.owner !== piece.owner && this.getPieceAt(state, left) !== null);
    
    const isRightBlocked = !GameUtils.isInBounds(right, state.config.boardWidth, state.config.boardHeight) || 
      (this.getPieceAt(state, right)?.owner !== piece.owner && this.getPieceAt(state, right) !== null);

    return isFrontBlocked && isLeftBlocked && isRightBlocked;
  }

  private initializePlayerData(config: GameConfig): Record<number, Record<string, any>> {
    const playerData: Record<number, Record<string, any>> = {};
    
    for (let i = 0; i < config.players; i++) {
      playerData[i] = {};
    }
    
    return playerData;
  }
}

// Export singleton instance for convenience
export const gameEngine = new GameEngine();