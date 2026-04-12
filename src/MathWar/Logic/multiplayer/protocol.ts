import type {
  MathWarEvent,
  MathWarState,
  MoveIntent,
  PlayerId,
} from "../v2";

export type MathWarRoomCode = string;

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
  code: MathWarRoomCode;
  playerName: string;
}

export interface SubmitMovePayload {
  code: MathWarRoomCode;
  intent: MoveIntent;
}

export interface RequestRematchPayload {
  code: MathWarRoomCode;
}

export interface LeaveRoomPayload {
  code: MathWarRoomCode;
}

export interface RoomCreatedPayload {
  code: MathWarRoomCode;
  seat: PlayerId;
  state: MathWarState;
  players: RoomPlayerInfo[];
}

export interface RoomJoinedPayload {
  code: MathWarRoomCode;
  seat: PlayerId;
  state: MathWarState;
  players: RoomPlayerInfo[];
}

export interface RoomReadyPayload {
  code: MathWarRoomCode;
  state: MathWarState;
  players: RoomPlayerInfo[];
}

export interface StateUpdatedPayload {
  code: MathWarRoomCode;
  state: MathWarState;
  events: MathWarEvent[];
}

export interface RematchRequestedPayload {
  code: MathWarRoomCode;
  requestedBy: PlayerId;
}

export interface RematchStartedPayload {
  code: MathWarRoomCode;
  state: MathWarState;
}

export interface OpponentLeftPayload {
  code: MathWarRoomCode;
  seat: PlayerId;
  reason: "disconnect" | "leave_room";
  message: string;
}

export interface RoomClosedPayload {
  code: MathWarRoomCode;
  reason: "waiting_host_left" | "opponent_left" | "room_expired";
  message: string;
}

export interface MultiplayerErrorPayload {
  code: MultiplayerErrorCode;
  message: string;
}

export interface MathWarClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  submit_move: (payload: SubmitMovePayload) => void;
  request_rematch: (payload: RequestRematchPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
}

export interface MathWarServerToClientEvents {
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
