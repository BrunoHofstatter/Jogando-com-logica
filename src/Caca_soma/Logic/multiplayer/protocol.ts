import type {
  CacaSomaEvent,
  CacaSomaMatchState,
  DifficultyId,
} from "../v2";

export type CacaSomaRoomCode = string;

export type CacaSomaRoomSeat = 0 | 1 | 2 | 3;

export type MultiplayerConnectionStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "playing"
  | "ended"
  | "disconnected";

export type MultiplayerErrorCode =
  | "invalid_name"
  | "invalid_settings"
  | "room_not_found"
  | "room_full"
  | "room_not_joinable"
  | "host_only"
  | "not_enough_players"
  | "illegal_move"
  | "cooldown_active"
  | "round_expired"
  | "unauthorized"
  | "server_error";

export interface CacaSomaRoomSettings {
  difficultyId: DifficultyId;
  targetScore: 2 | 3 | 4 | 5;
}

export interface RoomPlayerInfo {
  seat: CacaSomaRoomSeat;
  team: 0 | 1;
  playerIndex: 0 | 1;
  name: string;
  connected: boolean;
  isHost: boolean;
}

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  code: CacaSomaRoomCode;
  playerName: string;
}

export interface UpdateRoomSettingsPayload {
  code: CacaSomaRoomCode;
  settingsPatch: Partial<CacaSomaRoomSettings>;
}

export interface StartMatchPayload {
  code: CacaSomaRoomCode;
}

export type PlayerIntent =
  | {
      type: "set_player_selection";
      cellIds: readonly number[];
    }
  | {
      type: "set_player_ready";
      ready: boolean;
    };

export interface SubmitActionPayload {
  code: CacaSomaRoomCode;
  intent: PlayerIntent;
}

export interface RequestRematchPayload {
  code: CacaSomaRoomCode;
}

export interface LeaveRoomPayload {
  code: CacaSomaRoomCode;
}

export interface RoomCreatedPayload {
  code: CacaSomaRoomCode;
  seat: CacaSomaRoomSeat;
  settings: CacaSomaRoomSettings;
  state: CacaSomaMatchState | null;
  players: RoomPlayerInfo[];
}

export interface RoomJoinedPayload {
  code: CacaSomaRoomCode;
  seat: CacaSomaRoomSeat;
  settings: CacaSomaRoomSettings;
  state: CacaSomaMatchState | null;
  players: RoomPlayerInfo[];
}

export interface RoomUpdatedPayload {
  code: CacaSomaRoomCode;
  settings: CacaSomaRoomSettings;
  state: CacaSomaMatchState | null;
  players: RoomPlayerInfo[];
}

export interface RoomReadyPayload {
  code: CacaSomaRoomCode;
  settings: CacaSomaRoomSettings;
  state: CacaSomaMatchState;
  players: RoomPlayerInfo[];
}

export interface StateUpdatedPayload {
  code: CacaSomaRoomCode;
  state: CacaSomaMatchState;
  events: CacaSomaEvent[];
}

export interface RematchRequestedPayload {
  code: CacaSomaRoomCode;
  requestedBy: CacaSomaRoomSeat;
}

export interface RematchStartedPayload {
  code: CacaSomaRoomCode;
  state: CacaSomaMatchState;
}

export interface PlayerLeftPayload {
  code: CacaSomaRoomCode;
  seat: CacaSomaRoomSeat;
  reason: "disconnect" | "leave_room";
  message: string;
}

export interface RoomClosedPayload {
  code: CacaSomaRoomCode;
  reason: "player_left" | "room_expired";
  message: string;
}

export interface MultiplayerErrorPayload {
  code: MultiplayerErrorCode;
  message: string;
}

export interface CacaSomaClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  update_room_settings: (payload: UpdateRoomSettingsPayload) => void;
  start_match: (payload: StartMatchPayload) => void;
  submit_action: (payload: SubmitActionPayload) => void;
  request_rematch: (payload: RequestRematchPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
}

export interface CacaSomaServerToClientEvents {
  room_created: (payload: RoomCreatedPayload) => void;
  room_joined: (payload: RoomJoinedPayload) => void;
  room_updated: (payload: RoomUpdatedPayload) => void;
  room_ready: (payload: RoomReadyPayload) => void;
  state_updated: (payload: StateUpdatedPayload) => void;
  rematch_requested: (payload: RematchRequestedPayload) => void;
  rematch_started: (payload: RematchStartedPayload) => void;
  player_left: (payload: PlayerLeftPayload) => void;
  room_closed: (payload: RoomClosedPayload) => void;
  multiplayer_error: (payload: MultiplayerErrorPayload) => void;
}
