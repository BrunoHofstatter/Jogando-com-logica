import type {
  StopMultiplayerSettings,
  StopMultiplayerSettingsPatch,
  StopMultiplayerState,
} from "./types";

export type StopRoomCode = string;
export type StopPlayerId = string;

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
  | "unauthorized"
  | "host_only"
  | "invalid_settings"
  | "not_enough_players"
  | "round_not_active"
  | "answers_incomplete"
  | "server_error";

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  code: StopRoomCode;
  playerName: string;
}

export interface UpdateRoomSettingsPayload {
  code: StopRoomCode;
  settingsPatch: StopMultiplayerSettingsPatch;
}

export interface StartMatchPayload {
  code: StopRoomCode;
}

export interface LeaveRoomPayload {
  code: StopRoomCode;
}

export interface SubmitAnswerSnapshotPayload {
  code: StopRoomCode;
  answers: string[];
}

export interface PressStopPayload {
  code: StopRoomCode;
  answers: string[];
}

export interface RequestRematchPayload {
  code: StopRoomCode;
}

export interface RoomCreatedPayload {
  code: StopRoomCode;
  playerId: StopPlayerId;
  state: StopMultiplayerState;
}

export interface RoomJoinedPayload {
  code: StopRoomCode;
  playerId: StopPlayerId;
  state: StopMultiplayerState;
}

export interface StateUpdatedPayload {
  code: StopRoomCode;
  state: StopMultiplayerState;
}

export interface RoomClosedPayload {
  code: StopRoomCode;
  reason: "host_left" | "player_left" | "room_expired";
  message: string;
}

export interface MultiplayerErrorPayload {
  code: MultiplayerErrorCode;
  message: string;
}

export interface StopClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  update_room_settings: (payload: UpdateRoomSettingsPayload) => void;
  start_match: (payload: StartMatchPayload) => void;
  submit_answer_snapshot: (payload: SubmitAnswerSnapshotPayload) => void;
  press_stop: (payload: PressStopPayload) => void;
  request_rematch: (payload: RequestRematchPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
}

export interface StopServerToClientEvents {
  room_created: (payload: RoomCreatedPayload) => void;
  room_joined: (payload: RoomJoinedPayload) => void;
  state_updated: (payload: StateUpdatedPayload) => void;
  room_closed: (payload: RoomClosedPayload) => void;
  multiplayer_error: (payload: MultiplayerErrorPayload) => void;
}

export type { StopMultiplayerSettings, StopMultiplayerState };
