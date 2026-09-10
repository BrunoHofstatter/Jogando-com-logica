import type {
  ClassroomCode,
  ClassroomJoinedPayload,
  ClassroomRoomsUpdatedPayload,
  ClassroomUnavailablePayload,
  OpenRoomSummary,
} from "../../../CrownChase/Logic/multiplayer/protocol";
import type { BombRole, ManualCalculation, MistakeTarget, Operator, SectionId } from "../level1";
import type { BombLevelId } from "../levelCatalog";
import type { BombGameIntent } from "../levels";
import type { ComponentEquation, ComponentId, MarkerPositions, NavigationMap } from "../navigation";

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

export interface SharedViewState {
  roundId: string;
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
  levelId: 1;
  role: "bomb";
  orderingNumbers: number[];
  orderingProgress: number[];
  numericAnswers: [number | null, number | null, number | null];
  operatorAnswers: [Operator | null, Operator | null, Operator | null];
  numericTargets: [string, string, string];
  operatorEquations: [OperatorEquation, OperatorEquation, OperatorEquation];
}

export interface ManualViewState extends SharedViewState {
  levelId: 1;
  role: "manual";
  calculations: ManualCalculation[];
}

export interface NavigationBombViewState extends SharedViewState {
  levelId: 3;
  role: "bomb";
  exitRow: number;
  markers: MarkerPositions;
  gridPosition: number;
  gridVisited: number[];
  gridRevision: number;
  routes: ComponentId[][];
  initialEnergy: number;
  energy: number;
  activeRoute: number | null;
  energyStep: number;
  energyRevision: number;
}

export interface NavigationManualViewState extends SharedViewState {
  levelId: 3;
  role: "manual";
  exitRow: number;
  maps: NavigationMap[];
  equations: ComponentEquation[];
  solvedValues: [number | null, number | null, number | null];
  equationRevision: number;
  wrongEquation: ComponentId | null;
}

export type BombGameViewState = BombViewState | ManualViewState | NavigationBombViewState | NavigationManualViewState;

export interface RoomPayload {
  levelId: BombLevelId;
  code: string;
  seat: PlayerSeat;
  players: RoomPlayerInfo[];
  state: BombGameViewState | null;
}

export interface StatePayload {
  levelId: BombLevelId;
  code: string;
  players: RoomPlayerInfo[];
  state: BombGameViewState | null;
}

export interface BombGameClientToServerEvents {
  create_room: (payload: { playerName: string; hintsEnabled: boolean; classroomCode?: ClassroomCode; levelId?: BombLevelId }) => void;
  join_room: (payload: { code: string; playerName: string }) => void;
  set_role_preference: (payload: { code: string; preference: RolePreference }) => void;
  set_ready: (payload: { code: string; ready: boolean }) => void;
  submit_action: (payload: { code: string; actionId: string; roundId?: string; intent: BombGameIntent }) => void;
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
