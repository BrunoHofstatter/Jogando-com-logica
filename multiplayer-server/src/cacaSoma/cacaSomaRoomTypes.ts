import type { CacaSomaMatchState } from "../../../src/Caca_soma/Logic/v2/index.ts";
import type {
  CacaSomaRoomSeat,
  CacaSomaRoomSettings,
} from "../../../src/Caca_soma/Logic/multiplayer/protocol.ts";

export const CACA_SOMA_WAITING_ROOM_TTL_MS = 10 * 60 * 1000;
export const CACA_SOMA_DISCONNECT_GRACE_MS = 30 * 1000;
export const CACA_SOMA_ROOM_CAPACITY = 4;

export type CacaSomaRoomStatus = "waiting" | "playing" | "ended";

export interface CacaSomaRoomPlayer {
  socketId: string;
  seat: CacaSomaRoomSeat;
  team: 0 | 1;
  playerIndex: 0 | 1;
  name: string;
  connected: boolean;
  isHost: boolean;
}

export interface CacaSomaRoom {
  code: string;
  settings: CacaSomaRoomSettings;
  state: CacaSomaMatchState | null;
  status: CacaSomaRoomStatus;
  players: [
    CacaSomaRoomPlayer | null,
    CacaSomaRoomPlayer | null,
    CacaSomaRoomPlayer | null,
    CacaSomaRoomPlayer | null,
  ];
  createdAt: number;
  updatedAt: number;
  rematchVotes: Set<CacaSomaRoomSeat>;
  waitingTimeout: NodeJS.Timeout | null;
  closeTimeout: NodeJS.Timeout | null;
  roundTimeout: NodeJS.Timeout | null;
}

export function getSeatInfo(
  seat: CacaSomaRoomSeat,
): {
  team: 0 | 1;
  playerIndex: 0 | 1;
} {
  if (seat === 0) {
    return { team: 0, playerIndex: 0 };
  }

  if (seat === 1) {
    return { team: 0, playerIndex: 1 };
  }

  if (seat === 2) {
    return { team: 1, playerIndex: 0 };
  }

  return { team: 1, playerIndex: 1 };
}
