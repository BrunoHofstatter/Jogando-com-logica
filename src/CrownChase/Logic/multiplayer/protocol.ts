import type {
  CrownChaseEvent,
  CrownChaseState,
  MoveIntent,
  PlayerId,
} from "../v2";

export type CrownChaseRoomCode = string;

export type MultiplayerConnectionStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "playing"
  | "ended"
  | "disconnected";

export type MultiplayerErrorCode =
  | "invalid_name"
  | "room_not_found"
  | "room_full"
  | "room_not_joinable"
  | "not_your_turn"
  | "illegal_move"
  | "unauthorized"
  | "server_error";

export interface RoomPlayerInfo {
  seat: PlayerId;
  name: string;
  connected: boolean;
}

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  code: CrownChaseRoomCode;
  playerName: string;
}

export interface SubmitMovePayload {
  code: CrownChaseRoomCode;
  intent: MoveIntent;
}

export interface RequestRematchPayload {
  code: CrownChaseRoomCode;
}

export interface LeaveRoomPayload {
  code: CrownChaseRoomCode;
}

export interface RoomCreatedPayload {
  code: CrownChaseRoomCode;
  seat: PlayerId;
  state: CrownChaseState;
  players: RoomPlayerInfo[];
}

export interface RoomJoinedPayload {
  code: CrownChaseRoomCode;
  seat: PlayerId;
  state: CrownChaseState;
  players: RoomPlayerInfo[];
}

export interface RoomReadyPayload {
  code: CrownChaseRoomCode;
  state: CrownChaseState;
  players: RoomPlayerInfo[];
}

export interface StateUpdatedPayload {
  code: CrownChaseRoomCode;
  state: CrownChaseState;
  events: CrownChaseEvent[];
}

export interface RematchRequestedPayload {
  code: CrownChaseRoomCode;
  requestedBy: PlayerId;
}

export interface RematchStartedPayload {
  code: CrownChaseRoomCode;
  state: CrownChaseState;
}

export interface OpponentLeftPayload {
  code: CrownChaseRoomCode;
  seat: PlayerId;
  reason: "disconnect" | "leave_room";
  message: string;
}

export interface RoomClosedPayload {
  code: CrownChaseRoomCode;
  reason: "waiting_host_left" | "opponent_left" | "room_expired";
  message: string;
}

export interface MultiplayerErrorPayload {
  code: MultiplayerErrorCode;
  message: string;
}

export interface CrownChaseClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  submit_move: (payload: SubmitMovePayload) => void;
  request_rematch: (payload: RequestRematchPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
}

export interface CrownChaseServerToClientEvents {
  room_created: (payload: RoomCreatedPayload) => void;
  room_joined: (payload: RoomJoinedPayload) => void;
  room_ready: (payload: RoomReadyPayload) => void;
  state_updated: (payload: StateUpdatedPayload) => void;
  rematch_requested: (payload: RematchRequestedPayload) => void;
  rematch_started: (payload: RematchStartedPayload) => void;
  opponent_left: (payload: OpponentLeftPayload) => void;
  room_closed: (payload: RoomClosedPayload) => void;
  multiplayer_error: (payload: MultiplayerErrorPayload) => void;
}
