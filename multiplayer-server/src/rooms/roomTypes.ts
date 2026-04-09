import type { CrownChaseState, PlayerId } from "../../../src/CrownChase/Logic/v2/index.ts";

export const ROOM_CODE_LENGTH = 4;
export const WAITING_ROOM_TTL_MS = 10 * 60 * 1000;
export const DISCONNECT_GRACE_MS = 30 * 1000;
export const CREATOR_SEAT: PlayerId = 1;
export const JOINER_SEAT: PlayerId = 0;

export type RoomStatus = "waiting" | "playing" | "ended";

export interface RoomPlayer {
  socketId: string;
  seat: PlayerId;
  name: string;
  connected: boolean;
}

export interface CrownChaseRoom {
  code: string;
  state: CrownChaseState;
  status: RoomStatus;
  players: [RoomPlayer | null, RoomPlayer | null];
  createdAt: number;
  updatedAt: number;
  rematchVotes: Set<PlayerId>;
  waitingTimeout: NodeJS.Timeout | null;
  closeTimeout: NodeJS.Timeout | null;
}
