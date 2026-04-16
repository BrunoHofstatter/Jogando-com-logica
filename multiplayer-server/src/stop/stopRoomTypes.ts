import type { StopMultiplayerState } from "../../../src/Stop/Logic/multiplayer/types.ts";

export interface StopRoomParticipant {
  playerId: string;
  socketId: string;
}

export interface StopMultiplayerRoom {
  code: string;
  state: StopMultiplayerState;
  participants: StopRoomParticipant[];
  answerSnapshotsByPlayerId: Record<string, string[]>;
  createdAt: number;
  updatedAt: number;
  waitingTimeout: NodeJS.Timeout | null;
  roundPhaseTimeout: NodeJS.Timeout | null;
}
