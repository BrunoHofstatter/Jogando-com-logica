import type {
  CrownChaseEvent,
  CrownChaseState,
  MoveIntent,
  PlayerId,
} from "../v2";

export type CrownChaseRoomCode = string;
export type ClassroomCode = string;

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
  classroomCode?: ClassroomCode;
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

export interface ClassroomSummary {
  code: ClassroomCode;
  expiresAt: number;
}

export interface ManagedClassroom extends ClassroomSummary {
  managementToken: string;
}

export interface OpenRoomSummary {
  code: CrownChaseRoomCode;
  hostName: string;
}

export interface ListManagedClassroomsPayload {
  managementTokens: string[];
}

export interface DeleteClassroomPayload {
  code: ClassroomCode;
  managementToken: string;
}

export type ClassroomMonitorGame =
  | "crown_chase"
  | "spttt"
  | "math_war"
  | "caca_soma"
  | "stop"
  | "bomb_game";

export type ClassroomMonitorRoomStatus = "waiting" | "playing" | "ended";

export interface ClassroomMonitorPlayer {
  name: string;
  connected: boolean;
}

export interface ClassroomMonitorRoom {
  code: CrownChaseRoomCode;
  game: ClassroomMonitorGame;
  status: ClassroomMonitorRoomStatus;
  players: ClassroomMonitorPlayer[];
  capacity: number;
  createdAt: number;
}

export interface WatchClassroomPayload {
  code: ClassroomCode;
  managementToken: string;
}

export interface ClassroomMonitorUpdatedPayload {
  classroomCode: ClassroomCode;
  rooms: ClassroomMonitorRoom[];
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

export interface ClassroomCreatedPayload {
  classroom: ManagedClassroom;
}

export interface ManagedClassroomsPayload {
  classrooms: ManagedClassroom[];
}

export interface ClassroomDeletedPayload {
  code: ClassroomCode;
}

export interface ClassroomJoinedPayload {
  classroomCode: ClassroomCode;
  expiresAt: number;
  openRooms: OpenRoomSummary[];
}

export interface ClassroomRoomsUpdatedPayload {
  classroomCode: ClassroomCode;
  openRooms: OpenRoomSummary[];
}

export interface ClassroomUnavailablePayload {
  classroomCode: ClassroomCode;
  message: string;
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
  create_classroom: () => void;
  list_managed_classrooms: (payload: ListManagedClassroomsPayload) => void;
  delete_classroom: (payload: DeleteClassroomPayload) => void;
  watch_classroom: (payload: WatchClassroomPayload) => void;
  unwatch_classroom: (payload: WatchClassroomPayload) => void;
  join_classroom: (payload: JoinClassroomPayload) => void;
  leave_classroom: (payload: LeaveClassroomPayload) => void;
  list_open_rooms: (payload: ListOpenRoomsPayload) => void;
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
  classroom_created: (payload: ClassroomCreatedPayload) => void;
  managed_classrooms: (payload: ManagedClassroomsPayload) => void;
  classroom_deleted: (payload: ClassroomDeletedPayload) => void;
  classroom_monitor_updated: (payload: ClassroomMonitorUpdatedPayload) => void;
  classroom_joined: (payload: ClassroomJoinedPayload) => void;
  classroom_rooms_updated: (payload: ClassroomRoomsUpdatedPayload) => void;
  classroom_unavailable: (payload: ClassroomUnavailablePayload) => void;
}
