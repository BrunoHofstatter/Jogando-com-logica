import type {
  ApplyActionResult,
  DiceRoll,
  MathWarAction,
  MathWarBoard,
  MathWarEvent,
  MathWarPiece,
  MathWarState,
  MoveCostDetails,
  MoveEvaluation,
  MoveIntent,
  MoveInvalidReason,
  PieceType,
  PlayerId,
  Position,
} from "./types";

type RandomSource = () => number;

type PiecePlacement = {
  type: PieceType;
  row: number;
  col: number;
};

export interface CreateInitialStateOptions {
  startingPlayer?: PlayerId;
  rng?: RandomSource;
  startingDiceRoll?: DiceRoll;
}

export interface CreateStateOptions {
  board: MathWarBoard;
  currentPlayer?: PlayerId;
  turnCount?: number;
  status?: MathWarState["status"];
  winner?: MathWarState["winner"];
  endReason?: MathWarState["endReason"];
  diceRoll?: DiceRoll;
  lastAction?: MathWarAction | null;
}

export interface ApplyActionOptions {
  rng?: RandomSource;
  nextDiceRoll?: DiceRoll;
}

export const MATH_WAR_BOARD_WIDTH = 8;
export const MATH_WAR_BOARD_HEIGHT = 8;
export const MATH_WAR_DICE_SIDES = 5;
export const MATH_WAR_VALUE_SET: readonly (2 | 3 | 4)[] = [
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  4,
  4,
  4,
];

const PLAYER_ZERO_LAYOUT: readonly PiecePlacement[] = [
  { type: "sum", row: 0, col: 1 },
  { type: "sumDiag", row: 0, col: 2 },
  { type: "sum", row: 0, col: 3 },
  { type: "sum", row: 0, col: 4 },
  { type: "sumDiag", row: 0, col: 5 },
  { type: "sum", row: 0, col: 6 },
  { type: "sum", row: 1, col: 2 },
  { type: "sum", row: 1, col: 3 },
  { type: "sum", row: 1, col: 4 },
  { type: "sum", row: 1, col: 5 },
];

const PLAYER_ONE_LAYOUT: readonly PiecePlacement[] = [
  { type: "sum", row: 7, col: 1 },
  { type: "sumDiag", row: 7, col: 2 },
  { type: "sum", row: 7, col: 3 },
  { type: "sum", row: 7, col: 4 },
  { type: "sumDiag", row: 7, col: 5 },
  { type: "sum", row: 7, col: 6 },
  { type: "sum", row: 6, col: 2 },
  { type: "sum", row: 6, col: 3 },
  { type: "sum", row: 6, col: 4 },
  { type: "sum", row: 6, col: 5 },
];

export function createInitialState(
  options: CreateInitialStateOptions = {},
): MathWarState {
  const rng = options.rng ?? Math.random;
  const board = createEmptyBoard();
  const playerZeroValues = shuffleValues(MATH_WAR_VALUE_SET, rng);
  const playerOneValues = shuffleValues(MATH_WAR_VALUE_SET, rng);

  placePlayerPieces(board, 0, PLAYER_ZERO_LAYOUT, playerZeroValues);
  placePlayerPieces(board, 1, PLAYER_ONE_LAYOUT, playerOneValues);
  assignCaptain(board, 0, rng);
  assignCaptain(board, 1, rng);

  return createState({
    board,
    currentPlayer: options.startingPlayer ?? 0,
    turnCount: 0,
    diceRoll: options.startingDiceRoll ?? rollDice(rng),
  });
}

export function createState(options: CreateStateOptions): MathWarState {
  return {
    board: cloneBoard(options.board),
    currentPlayer: options.currentPlayer ?? 0,
    turnCount: options.turnCount ?? 0,
    status: options.status ?? "playing",
    winner: options.winner ?? null,
    endReason: options.endReason ?? null,
    diceRoll: options.diceRoll ?? [1, 1],
    lastAction: options.lastAction ?? null,
  };
}

export function createEmptyBoard(): MathWarBoard {
  return Array.from({ length: MATH_WAR_BOARD_HEIGHT }, () =>
    Array.from({ length: MATH_WAR_BOARD_WIDTH }, () => null),
  );
}

export function cloneBoard(board: MathWarBoard): MathWarBoard {
  return board.map((row) =>
    row.map((piece) =>
      piece
        ? {
            ...piece,
          }
        : null,
    ),
  );
}

export function getLegalActions(
  state: MathWarState,
  player: PlayerId = state.currentPlayer,
): MathWarAction[] {
  if (state.status === "ended") {
    return [];
  }

  const actions: MathWarAction[] = [];

  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < state.board[row].length; col++) {
      const piece = state.board[row][col];
      if (piece?.owner !== player) {
        continue;
      }

      actions.push(...getLegalActionsForPiece(state, { row, col }, player));
    }
  }

  return actions;
}

export function getLegalActionsForPiece(
  state: MathWarState,
  position: Position,
  player: PlayerId = state.currentPlayer,
): MathWarAction[] {
  if (state.status === "ended") {
    return [];
  }

  const piece = getPieceAt(state.board, position);
  if (!piece || piece.owner !== player) {
    return [];
  }

  const actions: MathWarAction[] = [];
  const directions = getDirectionsForPiece(piece.type);

  for (const direction of directions) {
    for (
      let distance = 1;
      distance <= Math.max(MATH_WAR_BOARD_WIDTH, MATH_WAR_BOARD_HEIGHT);
      distance++
    ) {
      const target = {
        row: position.row + direction.row * distance,
        col: position.col + direction.col * distance,
      };
      const evaluation = evaluateMove(state, { from: position, to: target }, player);

      if (!evaluation.isValid) {
        break;
      }

      actions.push({
        from: position,
        to: target,
        type: evaluation.actionType!,
        cost: evaluation.cost!,
        evaluation,
        capturedPiece: evaluation.targetPiece ?? undefined,
      });

      if (evaluation.actionType === "capture") {
        break;
      }
    }
  }

  return actions;
}

export function resolveMoveIntent(
  state: MathWarState,
  intent: MoveIntent,
  player: PlayerId = state.currentPlayer,
): MathWarAction | null {
  const evaluation = evaluateMove(state, intent, player);
  if (!evaluation.isValid || !evaluation.cost || !evaluation.actionType) {
    return null;
  }

  return {
    from: intent.from,
    to: intent.to,
    type: evaluation.actionType,
    cost: evaluation.cost,
    evaluation,
    capturedPiece: evaluation.targetPiece ?? undefined,
  };
}

export function evaluateMove(
  state: MathWarState,
  intent: MoveIntent,
  player: PlayerId = state.currentPlayer,
): MoveEvaluation {
  const baseEvaluation = createBaseEvaluation();

  if (state.status === "ended") {
    return withInvalidReason(baseEvaluation, "game_over");
  }

  if (!isInBounds(intent.from) || !isInBounds(intent.to)) {
    return withInvalidReason(baseEvaluation, "out_of_bounds");
  }

  if (positionsEqual(intent.from, intent.to)) {
    return withInvalidReason(baseEvaluation, "same_square");
  }

  const piece = getPieceAt(state.board, intent.from);
  if (!piece) {
    return withInvalidReason(baseEvaluation, "no_piece");
  }

  const targetPiece = getPieceAt(state.board, intent.to);
  const cost = calculateMoveCost(state, intent, player);
  const availableEnergy = getPieceAvailableEnergy(state, piece);
  const actionType = targetPiece && targetPiece.owner !== piece.owner ? "capture" : "move";

  const evaluation: MoveEvaluation = {
    ...baseEvaluation,
    availableEnergy,
    requiredEnergy: cost?.totalCost ?? 0,
    cost,
    actionType,
    piece,
    targetPiece,
  };

  if (piece.owner !== player) {
    return withInvalidReason(evaluation, "not_your_piece");
  }

  if (targetPiece?.owner === piece.owner) {
    return withInvalidReason(
      {
        ...evaluation,
        actionType: null,
      },
      "ally_on_destination",
    );
  }

  if (!matchesMovementPattern(piece.type, intent.from, intent.to)) {
    return withInvalidReason(evaluation, "invalid_direction");
  }

  if (!isPathClear(state.board, intent.from, intent.to)) {
    return withInvalidReason(evaluation, "path_blocked");
  }

  if ((cost?.totalCost ?? 0) > availableEnergy) {
    return withInvalidReason(evaluation, "insufficient_energy");
  }

  return {
    ...evaluation,
    isValid: true,
    invalidReason: null,
  };
}

export function calculateMoveCost(
  state: MathWarState,
  intent: MoveIntent,
  player: PlayerId = state.currentPlayer,
): MoveCostDetails | null {
  if (!isInBounds(intent.from) || !isInBounds(intent.to) || positionsEqual(intent.from, intent.to)) {
    return null;
  }

  const piece = getPieceAt(state.board, intent.from);
  if (!piece || piece.owner !== player) {
    return null;
  }

  const targetPiece = getPieceAt(state.board, intent.to);
  const rowDiff = Math.abs(intent.to.row - intent.from.row);
  const colDiff = Math.abs(intent.to.col - intent.from.col);
  const distance = Math.max(rowDiff, colDiff);
  const movementCost = distance * 2;
  const captureAddsCost = targetPiece !== null && targetPiece.owner !== piece.owner;
  const captureCost = captureAddsCost ? 2 : 0;
  const baseCost = movementCost + captureCost;
  const captainRuleChangedCost = piece.isCaptain;

  return {
    totalCost: captainRuleChangedCost ? baseCost * 2 : baseCost,
    movementCost,
    captureCost,
    distance,
    captureAddsCost,
    captainRuleChangedCost,
  };
}

export function applyAction(
  state: MathWarState,
  action: MathWarAction,
  options: ApplyActionOptions = {},
): ApplyActionResult {
  if (state.status === "ended") {
    return {
      ok: false,
      reason: "game_over",
      evaluation: {
        ...action.evaluation,
        isValid: false,
        invalidReason: "game_over",
      },
    };
  }

  const resolvedAction = resolveMoveIntent(state, action, state.currentPlayer);
  if (!resolvedAction || resolvedAction.type !== action.type) {
    return {
      ok: false,
      reason: "illegal_move",
      evaluation: evaluateMove(state, action, state.currentPlayer),
    };
  }

  const nextBoard = cloneBoard(state.board);
  const movingPiece = nextBoard[resolvedAction.from.row][resolvedAction.from.col];
  const capturedPiece = nextBoard[resolvedAction.to.row][resolvedAction.to.col];

  if (!movingPiece) {
    return {
      ok: false,
      reason: "illegal_move",
      evaluation: evaluateMove(state, action, state.currentPlayer),
    };
  }

  nextBoard[resolvedAction.to.row][resolvedAction.to.col] = movingPiece;
  nextBoard[resolvedAction.from.row][resolvedAction.from.col] = null;

  const committedAction: MathWarAction = {
    ...resolvedAction,
    capturedPiece: capturedPiece ?? undefined,
  };
  const events: MathWarEvent[] = [];

  if (capturedPiece) {
    events.push({
      type: "piece_captured",
      by: state.currentPlayer,
      at: resolvedAction.to,
      piece: capturedPiece,
    });
  }

  if (capturedPiece?.isCaptain) {
    return {
      ok: true,
      state: {
        board: nextBoard,
        currentPlayer: state.currentPlayer,
        turnCount: state.turnCount,
        status: "ended",
        winner: state.currentPlayer,
        endReason: "captain_captured",
        diceRoll: state.diceRoll,
        lastAction: committedAction,
      },
      action: committedAction,
      events: [
        ...events,
        {
          type: "game_ended",
          winner: state.currentPlayer,
          reason: "captain_captured",
        },
      ],
    };
  }

  const nextPlayer = getOpponent(state.currentPlayer);
  const nextTurnCount = state.turnCount + 1;
  const nextDiceRoll = shouldRollDice(nextTurnCount)
    ? options.nextDiceRoll ?? rollDice(options.rng ?? Math.random)
    : state.diceRoll;

  if (shouldRollDice(nextTurnCount)) {
    events.push({
      type: "dice_rolled",
      diceRoll: nextDiceRoll,
      total: getDiceTotalFromRoll(nextDiceRoll),
      player: nextPlayer,
    });
  }

  events.push({
    type: "turn_changed",
    player: nextPlayer,
  });

  return {
    ok: true,
    state: {
      board: nextBoard,
      currentPlayer: nextPlayer,
      turnCount: nextTurnCount,
      status: "playing",
      winner: null,
      endReason: null,
      diceRoll: nextDiceRoll,
      lastAction: committedAction,
    },
    action: committedAction,
    events,
  };
}

export function getPieceAt(
  board: MathWarBoard,
  position: Position,
): MathWarPiece | null {
  if (!isInBounds(position)) {
    return null;
  }

  return board[position.row][position.col];
}

export function getPieceAvailableEnergy(
  state: MathWarState,
  pieceOrPosition: MathWarPiece | Position | null,
): number {
  const piece =
    pieceOrPosition === null
      ? null
      : "row" in pieceOrPosition
        ? getPieceAt(state.board, pieceOrPosition)
        : pieceOrPosition;

  if (!piece) {
    return 0;
  }

  return piece.value + getDiceTotal(state);
}

export function getDiceTotal(state: MathWarState): number {
  return getDiceTotalFromRoll(state.diceRoll);
}

export function getRoundsUntilNextRoll(state: MathWarState): number {
  return 3 - (state.turnCount % 3);
}

export function getPlayerPieces(
  state: MathWarState,
  player: PlayerId,
): Array<{ piece: MathWarPiece; position: Position }> {
  const pieces: Array<{ piece: MathWarPiece; position: Position }> = [];

  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < state.board[row].length; col++) {
      const piece = state.board[row][col];
      if (piece?.owner === player) {
        pieces.push({
          piece,
          position: { row, col },
        });
      }
    }
  }

  return pieces;
}

export function isGameOver(state: MathWarState): boolean {
  return state.status === "ended";
}

function placePlayerPieces(
  board: MathWarBoard,
  owner: PlayerId,
  layout: readonly PiecePlacement[],
  values: ReadonlyArray<2 | 3 | 4>,
): void {
  layout.forEach((placement, index) => {
    board[placement.row][placement.col] = {
      id: `mathwar-${owner}-${index}`,
      type: placement.type,
      owner,
      value: values[index],
      isCaptain: false,
    };
  });
}

function assignCaptain(board: MathWarBoard, player: PlayerId, rng: RandomSource): void {
  const backRow = player === 0 ? 0 : 7;
  const candidates: MathWarPiece[] = [];

  for (let col = 0; col < board[backRow].length; col++) {
    const piece = board[backRow][col];
    if (piece?.owner === player) {
      candidates.push(piece);
    }
  }

  if (candidates.length === 0) {
    return;
  }

  const selectedIndex = Math.floor(rng() * candidates.length);
  candidates[selectedIndex].isCaptain = true;
}

function shuffleValues(
  values: ReadonlyArray<2 | 3 | 4>,
  rng: RandomSource,
): Array<2 | 3 | 4> {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function rollDice(rng: RandomSource): DiceRoll {
  return [
    Math.floor(rng() * MATH_WAR_DICE_SIDES) + 1,
    Math.floor(rng() * MATH_WAR_DICE_SIDES) + 1,
  ];
}

function createBaseEvaluation(): MoveEvaluation {
  return {
    isValid: false,
    invalidReason: null,
    availableEnergy: 0,
    requiredEnergy: 0,
    cost: null,
    actionType: null,
    piece: null,
    targetPiece: null,
  };
}

function withInvalidReason(
  evaluation: MoveEvaluation,
  invalidReason: MoveInvalidReason,
): MoveEvaluation {
  return {
    ...evaluation,
    isValid: false,
    invalidReason,
  };
}

function getDirectionsForPiece(type: PieceType): Array<{ row: number; col: number }> {
  if (type === "sum") {
    return [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ];
  }

  return [
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ];
}

function matchesMovementPattern(
  type: PieceType,
  from: Position,
  to: Position,
): boolean {
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);

  if (type === "sum") {
    return (from.row === to.row) !== (from.col === to.col);
  }

  return rowDiff === colDiff && rowDiff > 0;
}

function isPathClear(
  board: MathWarBoard,
  from: Position,
  to: Position,
): boolean {
  const distance = Math.max(
    Math.abs(to.row - from.row),
    Math.abs(to.col - from.col),
  );

  if (distance <= 1) {
    return true;
  }

  const rowStep = Math.sign(to.row - from.row);
  const colStep = Math.sign(to.col - from.col);
  let row = from.row + rowStep;
  let col = from.col + colStep;

  while (row !== to.row || col !== to.col) {
    if (board[row][col] !== null) {
      return false;
    }

    row += rowStep;
    col += colStep;
  }

  return true;
}

function isInBounds(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < MATH_WAR_BOARD_HEIGHT &&
    position.col >= 0 &&
    position.col < MATH_WAR_BOARD_WIDTH
  );
}

function positionsEqual(left: Position, right: Position): boolean {
  return left.row === right.row && left.col === right.col;
}

function shouldRollDice(turnCount: number): boolean {
  return turnCount % 3 === 0;
}

function getDiceTotalFromRoll(diceRoll: DiceRoll): number {
  return diceRoll[0] + diceRoll[1];
}

function getOpponent(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}
