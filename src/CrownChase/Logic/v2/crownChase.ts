import type {
  ApplyActionResult,
  CrownChaseAction,
  CrownChaseBoard,
  CrownChaseEvent,
  CrownChasePiece,
  CrownChaseState,
  MoveIntent,
  PlayerId,
  Position,
  ResolveTurnStateResult,
} from "./types";

type PieceSetup = CrownChasePiece & Position;

export const CROWN_CHASE_BOARD_WIDTH = 5;
export const CROWN_CHASE_BOARD_HEIGHT = 5;

const INITIAL_PIECES: readonly PieceSetup[] = [
  { type: "jumper", owner: 0, row: 1, col: 3 },
  { type: "jumper", owner: 0, row: 0, col: 2 },
  { type: "jumper", owner: 0, row: 2, col: 4 },
  { type: "killer", owner: 0, row: 0, col: 3 },
  { type: "killer", owner: 0, row: 1, col: 4 },
  { type: "king", owner: 0, row: 0, col: 4 },
  { type: "jumper", owner: 1, row: 2, col: 0 },
  { type: "jumper", owner: 1, row: 3, col: 1 },
  { type: "jumper", owner: 1, row: 4, col: 2 },
  { type: "killer", owner: 1, row: 4, col: 1 },
  { type: "killer", owner: 1, row: 3, col: 0 },
  { type: "king", owner: 1, row: 4, col: 0 },
];

export function createInitialState(
  options: { startingPlayer?: PlayerId } = {},
): CrownChaseState {
  const board = createEmptyBoard();

  for (const piece of INITIAL_PIECES) {
    board[piece.row][piece.col] = {
      type: piece.type,
      owner: piece.owner,
    };
  }

  const initialState: CrownChaseState = {
    board,
    currentPlayer: options.startingPlayer ?? 1,
    turnCount: 0,
    status: "playing",
    winner: null,
    endReason: null,
    capturedByPlayer: [0, 0],
  };

  return resolveTurnState(initialState).state;
}

export function getLegalActions(
  state: CrownChaseState,
  player: PlayerId = state.currentPlayer,
): CrownChaseAction[] {
  if (state.status === "ended") {
    return [];
  }

  const actions: CrownChaseAction[] = [];

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
  state: CrownChaseState,
  position: Position,
  player: PlayerId = state.currentPlayer,
): CrownChaseAction[] {
  if (state.status === "ended") {
    return [];
  }

  const piece = getPieceAt(state.board, position);
  if (!piece) {
    return [];
  }

  if (piece.owner !== player) {
    return [];
  }

  switch (piece.type) {
    case "king":
      return [];
    case "killer":
      return getKillerActions(state.board, position, piece.owner);
    case "jumper":
      return getJumperActions(state.board, position, piece.owner);
    default:
      return [];
  }
}

export function resolveMoveIntent(
  state: CrownChaseState,
  intent: MoveIntent,
  player: PlayerId = state.currentPlayer,
): CrownChaseAction | null {
  return (
    getLegalActions(state, player).find(
      (candidate) =>
        positionsEqual(candidate.from, intent.from) &&
        positionsEqual(candidate.to, intent.to),
    ) ?? null
  );
}

export function resolveTurnState(state: CrownChaseState): ResolveTurnStateResult {
  if (state.status === "ended") {
    return { state, events: [] };
  }

  const currentPlayerActions = getLegalActions(state, state.currentPlayer);
  if (currentPlayerActions.length > 0) {
    return { state, events: [] };
  }

  const skippedPlayer = state.currentPlayer;
  const nextPlayer = getOpponent(skippedPlayer);
  const nextPlayerActions = getLegalActions(state, nextPlayer);
  const events: CrownChaseEvent[] = [{ type: "turn_skipped", player: skippedPlayer }];

  if (nextPlayerActions.length === 0) {
    return {
      state: {
        ...state,
        status: "ended",
        winner: null,
        endReason: "double_stuck",
      },
      events: [
        ...events,
        {
          type: "game_ended",
          winner: null,
          reason: "double_stuck",
        },
      ],
    };
  }

  return {
    state: {
      ...state,
      currentPlayer: nextPlayer,
    },
    events,
  };
}

export function applyAction(
  state: CrownChaseState,
  action: CrownChaseAction,
): ApplyActionResult {
  if (state.status === "ended") {
    return { ok: false, reason: "game_over" };
  }

  const legalAction = resolveMoveIntent(state, action);

  if (!legalAction || legalAction.type !== action.type) {
    return { ok: false, reason: "illegal_action" };
  }

  const nextBoard = cloneBoard(state.board);
  const movingPiece = nextBoard[legalAction.from.row][legalAction.from.col];
  const capturedPiece = state.board[legalAction.to.row][legalAction.to.col];

  if (!movingPiece) {
    return { ok: false, reason: "illegal_action" };
  }

  nextBoard[legalAction.to.row][legalAction.to.col] = movingPiece;
  nextBoard[legalAction.from.row][legalAction.from.col] = null;

  const nextState: CrownChaseState = {
    board: nextBoard,
    currentPlayer: getOpponent(state.currentPlayer),
    turnCount: state.turnCount + 1,
    status: "playing",
    winner: null,
    endReason: null,
    capturedByPlayer: [
      state.capturedByPlayer[0],
      state.capturedByPlayer[1],
    ],
  };

  const events: CrownChaseEvent[] = [];

  if (legalAction.type === "capture" && capturedPiece) {
    nextState.capturedByPlayer[state.currentPlayer] += 1;
    events.push({
      type: "piece_captured",
      by: state.currentPlayer,
      at: legalAction.to,
      piece: capturedPiece,
    });

    if (capturedPiece.type === "king") {
      const endedState: CrownChaseState = {
        ...nextState,
        currentPlayer: state.currentPlayer,
        status: "ended",
        winner: state.currentPlayer,
        endReason: "king_captured",
      };

      return {
        ok: true,
        state: endedState,
        events: [
          ...events,
          {
            type: "game_ended",
            winner: state.currentPlayer,
            reason: "king_captured",
          },
        ],
      };
    }
  }

  const resolvedTurn = resolveTurnState(nextState);
  const finalEvents =
    resolvedTurn.state.status === "playing"
      ? [
          ...events,
          ...resolvedTurn.events,
          { type: "turn_changed", player: resolvedTurn.state.currentPlayer } as const,
        ]
      : [...events, ...resolvedTurn.events];

  return {
    ok: true,
    state: resolvedTurn.state,
    events: finalEvents,
  };
}

export function getWinner(state: CrownChaseState): PlayerId | null {
  return state.winner;
}

export function isGameOver(state: CrownChaseState): boolean {
  return state.status === "ended";
}

function createEmptyBoard(): CrownChaseBoard {
  return Array.from({ length: CROWN_CHASE_BOARD_HEIGHT }, () =>
    Array.from({ length: CROWN_CHASE_BOARD_WIDTH }, () => null),
  );
}

function getKillerActions(
  board: CrownChaseBoard,
  from: Position,
  owner: PlayerId,
): CrownChaseAction[] {
  const actions: CrownChaseAction[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const to = {
        row: from.row + rowOffset,
        col: from.col + colOffset,
      };

      if (!isInBounds(to)) {
        continue;
      }

      const target = board[to.row][to.col];
      if (!target) {
        actions.push({ type: "move", from, to });
        continue;
      }

      if (target.owner !== owner) {
        actions.push({ type: "capture", from, to });
      }
    }
  }

  return actions;
}

function getJumperActions(
  board: CrownChaseBoard,
  from: Position,
  owner: PlayerId,
): CrownChaseAction[] {
  const actions: CrownChaseAction[] = [];
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  for (const direction of directions) {
    const step = {
      row: from.row + direction.row,
      col: from.col + direction.col,
    };

    if (isInBounds(step)) {
      pushJumperAction(board, actions, from, step, owner, false);
    }

    const jump = {
      row: from.row + direction.row * 2,
      col: from.col + direction.col * 2,
    };

    if (!isInBounds(jump)) {
      continue;
    }

    const middle = {
      row: from.row + direction.row,
      col: from.col + direction.col,
    };

    if (!board[middle.row][middle.col]) {
      continue;
    }

    pushJumperAction(board, actions, from, jump, owner, true);
  }

  return actions;
}

function pushJumperAction(
  board: CrownChaseBoard,
  actions: CrownChaseAction[],
  from: Position,
  to: Position,
  owner: PlayerId,
  isJump: boolean,
): void {
  const target = board[to.row][to.col];

  if (!target) {
    actions.push({ type: "move", from, to });
    return;
  }

  if (target.owner === owner) {
    return;
  }

  if (target.type === "king") {
    actions.push({ type: "capture", from, to });
    return;
  }

  if (!isJump) {
    return;
  }
}

function getPieceAt(
  board: CrownChaseBoard,
  position: Position,
): CrownChasePiece | null {
  if (!isInBounds(position)) {
    return null;
  }

  return board[position.row][position.col];
}

function isInBounds(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < CROWN_CHASE_BOARD_HEIGHT &&
    position.col >= 0 &&
    position.col < CROWN_CHASE_BOARD_WIDTH
  );
}

function cloneBoard(board: CrownChaseBoard): CrownChaseBoard {
  return board.map((row) =>
    row.map((piece) =>
      piece
        ? {
            type: piece.type,
            owner: piece.owner,
          }
        : null,
    ),
  );
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function getOpponent(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}

export type { CrownChaseAction, CrownChaseState, CrownChasePiece, Position, PlayerId, PieceType } from "./types";
