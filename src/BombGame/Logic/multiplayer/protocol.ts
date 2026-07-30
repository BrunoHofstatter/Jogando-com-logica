import type {
  ClassroomCode,
  ClassroomJoinedPayload,
  ClassroomRoomsUpdatedPayload,
  ClassroomUnavailablePayload,
  OpenRoomSummary,
} from "../../../CrownChase/Logic/multiplayer/protocol";
import type { BombRole, Level1Intent, ManualCalculation, MistakeTarget, Operator, SectionId } from "../level1";

export type PlayerSeat = 0 | 1;
export type RoomPhase = "role_selection" | "countdown" | "playing" | "won" | "lost" | "replay_countdown";
export type RolePreference = BombRole | "either";
export type { ClassroomCode, OpenRoomSummary };

export interface RoomPlayerInfo {
  seat: PlayerSeat;
  name: string;
  connected: boolean;
  preference: RolePreference;
  role: BombRole | null;
  ready: boolean;
}

interface SharedViewState {
  phase: RoomPhase;
  lives: number;
  hintsEnabled: boolean;
  countdownEndsAt: number | null;
  timerEndsAt: number | null;
  replayCountdownEndsAt: number | null;
  replayVotes: PlayerSeat[];
  completedSections: SectionId[];
  eventId: number;
  mistake: MistakeTarget | null;
  resultReason: "completed" | "lives" | "time" | null;
}

export interface OperatorEquation {
  left: string;
  right: string;
  result: number;
}

export interface BombViewState extends SharedViewState {
  role: "bomb";
  orderingNumbers: number[];
  orderingProgress: number[];
  numericAnswers: [number | null, number | null, number | null];
  operatorAnswers: [Operator | null, Operator | null, Operator | null];
  numericTargets: [string, string, string];
  operatorEquations: [OperatorEquation, OperatorEquation, OperatorEquation];
}

export interface ManualViewState extends SharedViewState {
  role: "manual";
  calculations: ManualCalculation[];
}

export type BombGameViewState = BombViewState | ManualViewState;

export interface RoomPayload {
  code: string;
  seat: PlayerSeat;
  players: RoomPlayerInfo[];
  state: BombGameViewState | null;
}

export interface StatePayload {
  code: string;
  players: RoomPlayerInfo[];
  state: BombGameViewState | null;
}

export interface BombGameClientToServerEvents {
  create_room: (payload: { playerName: string; hintsEnabled: boolean; classroomCode?: ClassroomCode }) => void;
  join_room: (payload: { code: string; playerName: string }) => void;
  set_role_preference: (payload: { code: string; preference: RolePreference }) => void;
  set_ready: (payload: { code: string; ready: boolean }) => void;
  submit_action: (payload: { code: string; actionId: string; intent: Level1Intent }) => void;
  set_replay_vote: (payload: { code: string; wantsReplay: boolean }) => void;
  leave_room: (payload: { code: string }) => void;
  join_classroom: (payload: { code: ClassroomCode }) => void;
  leave_classroom: (payload: { code: ClassroomCode }) => void;
  list_open_rooms: (payload: { classroomCode: ClassroomCode }) => void;
}

export interface BombGameServerToClientEvents {
  room_created: (payload: RoomPayload) => void;
  room_joined: (payload: RoomPayload) => void;
  state_updated: (payload: StatePayload) => void;
  opponent_left: (payload: { code: string; message: string }) => void;
  room_closed: (payload: { code: string; message: string }) => void;
  multiplayer_error: (payload: { code: string; message: string }) => void;
  classroom_joined: (payload: ClassroomJoinedPayload) => void;
  classroom_rooms_updated: (payload: ClassroomRoomsUpdatedPayload) => void;
  classroom_unavailable: (payload: ClassroomUnavailablePayload) => void;
}
