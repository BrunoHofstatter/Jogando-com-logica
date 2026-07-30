import type {
  StopMultiplayerSettings,
  StopMultiplayerSettingsPatch,
  StopMultiplayerState,
} from "./types";
import type {
  ClassroomCode,
  ClassroomUnavailablePayload,
} from "../../../CrownChase/Logic/multiplayer/protocol";

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
  | "classroom_not_found"
  | "unauthorized"
  | "host_only"
  | "invalid_settings"
  | "not_enough_players"
  | "round_not_active"
  | "answers_incomplete"
  | "server_error";

export interface CreateRoomPayload {
  playerName: string;
  classroomCode?: ClassroomCode;
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

export interface RemovePlayerPayload {
  code: StopRoomCode;
  playerId: StopPlayerId;
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

export interface StopOpenRoomSummary {
  code: StopRoomCode;
  hostName: string;
  playerCount: number;
  playerLimit: number;
  difficulty: StopMultiplayerSettings["difficulty"];
  roundCount: number;
  progressiveDifficulty: boolean;
}

export interface JoinClassroomPayload {
  code: ClassroomCode;
}

export interface LeaveClassroomPayload {
  code: ClassroomCode;
}

export interface ListOpenRoomsPayload {
  classroomCode: ClassroomCode;
}

export interface StopClassroomRoomsPayload {
  classroomCode: ClassroomCode;
  expiresAt?: number;
  openRooms: StopOpenRoomSummary[];
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

export interface PlayerRemovedPayload {
  code: StopRoomCode;
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
  remove_player: (payload: RemovePlayerPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
  join_classroom: (payload: JoinClassroomPayload) => void;
  leave_classroom: (payload: LeaveClassroomPayload) => void;
  list_open_rooms: (payload: ListOpenRoomsPayload) => void;
}

export interface StopServerToClientEvents {
  room_created: (payload: RoomCreatedPayload) => void;
  room_joined: (payload: RoomJoinedPayload) => void;
  state_updated: (payload: StateUpdatedPayload) => void;
  player_removed: (payload: PlayerRemovedPayload) => void;
  room_closed: (payload: RoomClosedPayload) => void;
  multiplayer_error: (payload: MultiplayerErrorPayload) => void;
  classroom_joined: (payload: StopClassroomRoomsPayload) => void;
  classroom_rooms_updated: (payload: StopClassroomRoomsPayload) => void;
  classroom_unavailable: (payload: ClassroomUnavailablePayload) => void;
}

export type { ClassroomCode, StopMultiplayerSettings, StopMultiplayerState };
