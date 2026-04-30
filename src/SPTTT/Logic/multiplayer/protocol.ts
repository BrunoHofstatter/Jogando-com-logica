import type {
  MoveIntent,
  SptttPlayer,
  SptttState,
} from "../v2";

export type SptttRoomCode = string;
export type PlayerSeat = 0 | 1;

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
  seat: PlayerSeat;
  mark: SptttPlayer;
  name: string;
  connected: boolean;
}

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  code: SptttRoomCode;
  playerName: string;
}

export interface SubmitMovePayload {
  code: SptttRoomCode;
  intent: MoveIntent;
}

export interface RequestRematchPayload {
  code: SptttRoomCode;
}

export interface LeaveRoomPayload {
  code: SptttRoomCode;
}

export interface RoomCreatedPayload {
  code: SptttRoomCode;
  seat: PlayerSeat;
  mark: SptttPlayer;
  state: SptttState;
  players: RoomPlayerInfo[];
}

export interface RoomJoinedPayload {
  code: SptttRoomCode;
  seat: PlayerSeat;
  mark: SptttPlayer;
  state: SptttState;
  players: RoomPlayerInfo[];
}

export interface RoomReadyPayload {
  code: SptttRoomCode;
  state: SptttState;
  players: RoomPlayerInfo[];
}

export interface StateUpdatedPayload {
  code: SptttRoomCode;
  state: SptttState;
}

export interface RematchRequestedPayload {
  code: SptttRoomCode;
  requestedBy: PlayerSeat;
}

export interface RematchStartedPayload {
  code: SptttRoomCode;
  state: SptttState;
}

export interface OpponentLeftPayload {
  code: SptttRoomCode;
  seat: PlayerSeat;
  reason: "disconnect" | "leave_room";
  message: string;
}

export interface RoomClosedPayload {
  code: SptttRoomCode;
  reason: "waiting_host_left" | "opponent_left" | "room_expired";
  message: string;
}

export interface MultiplayerErrorPayload {
  code: MultiplayerErrorCode;
  message: string;
}

export interface SptttClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  submit_move: (payload: SubmitMovePayload) => void;
  request_rematch: (payload: RequestRematchPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
}

export interface SptttServerToClientEvents {
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
