export const ROOM_CODE_LENGTH = 4;
export const WAITING_ROOM_TTL_MS = 10 * 60 * 1000;
export const DISCONNECT_GRACE_MS = 30 * 1000;
export const CREATOR_SEAT = 1 as const;
export const JOINER_SEAT = 0 as const;

export type RoomSeat = typeof CREATOR_SEAT | typeof JOINER_SEAT;
export type RoomStatus = "waiting" | "playing" | "ended";

export interface RoomPlayer {
  socketId: string;
  seat: RoomSeat;
  name: string;
  connected: boolean;
}

export interface MultiplayerRoom<TState> {
  code: string;
  state: TState;
  status: RoomStatus;
  players: [RoomPlayer | null, RoomPlayer | null];
  createdAt: number;
  updatedAt: number;
  rematchVotes: Set<RoomSeat>;
  waitingTimeout: NodeJS.Timeout | null;
  closeTimeout: NodeJS.Timeout | null;
}
