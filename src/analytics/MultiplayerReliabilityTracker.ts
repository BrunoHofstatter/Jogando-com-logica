import {
  analytics,
  type GameId,
  type MultiplayerConnectionStage,
  type MultiplayerDisconnectErrorCode,
  type MultiplayerDisconnectParameters,
  type MultiplayerJoinErrorCode,
  type MultiplayerJoinResultParameters,
  type MultiplayerJoinType,
} from "./events";

type JoinResultSender = (parameters: MultiplayerJoinResultParameters) => boolean;
type DisconnectSender = (parameters: MultiplayerDisconnectParameters) => boolean;

interface RoomContext {
  gameId: GameId;
  joinType: MultiplayerJoinType;
}

interface PendingJoin extends RoomContext {
  startedAt: number;
}

const SERVER_JOIN_ERROR_CODES = new Set<MultiplayerJoinErrorCode>([
  "classroom_not_found",
  "invalid_name",
  "room_full",
  "room_not_found",
  "room_not_joinable",
]);

export class MultiplayerReliabilityTracker {
  private pendingJoin: PendingJoin | null = null;
  private pendingCreatedRoom: RoomContext | null = null;
  private activeRoom: RoomContext | null = null;

  constructor(
    private readonly sendJoinResult: JoinResultSender =
      analytics.multiplayerJoinResult,
    private readonly sendDisconnect: DisconnectSender =
      analytics.multiplayerDisconnected,
    private readonly now: () => number = Date.now,
  ) {}

  startJoin(gameId: GameId, joinType: MultiplayerJoinType): void {
    this.pendingCreatedRoom = null;
    this.activeRoom = null;
    this.pendingJoin = {
      gameId,
      joinType,
      startedAt: this.now(),
    };
  }

  startRoomCreation(gameId: GameId, joinType: MultiplayerJoinType): void {
    this.pendingJoin = null;
    this.activeRoom = null;
    this.pendingCreatedRoom = { gameId, joinType };
  }

  roomCreated(): boolean {
    if (!this.pendingCreatedRoom) {
      return false;
    }

    this.activeRoom = this.pendingCreatedRoom;
    this.pendingCreatedRoom = null;
    return true;
  }

  joinSucceeded(): boolean {
    if (!this.pendingJoin) {
      return false;
    }

    this.activeRoom = {
      gameId: this.pendingJoin.gameId,
      joinType: this.pendingJoin.joinType,
    };
    return this.finishJoin(true);
  }

  failConnection(errorCode: "network_error" | "server_unavailable"): boolean {
    return this.finishJoin(false, errorCode);
  }

  failServer(rawErrorCode: string): boolean {
    if (this.pendingCreatedRoom) {
      if (
        rawErrorCode === "classroom_not_found"
        && this.pendingCreatedRoom.joinType !== "classroom_room"
      ) {
        return false;
      }

      this.pendingCreatedRoom = null;
      return false;
    }

    if (!this.pendingJoin) {
      return false;
    }

    if (
      rawErrorCode === "classroom_not_found"
      && this.pendingJoin.joinType !== "classroom_room"
    ) {
      return false;
    }

    const errorCode = SERVER_JOIN_ERROR_CODES.has(
      rawErrorCode as MultiplayerJoinErrorCode,
    )
      ? (rawErrorCode as MultiplayerJoinErrorCode)
      : "server_error";

    return this.finishJoin(false, errorCode);
  }

  disconnected(socketReason: string, currentStatus: string): boolean {
    const joinFailed = this.failConnection("network_error");
    const activeRoom = this.activeRoom;
    this.activeRoom = null;

    if (
      socketReason === "io client disconnect"
      || currentStatus === "ended"
      || !activeRoom
    ) {
      return joinFailed;
    }

    return this.sendDisconnect({
      ...activeRoom,
      connectionStage: normalizeConnectionStage(currentStatus),
      errorCode: normalizeDisconnectErrorCode(socketReason),
    });
  }

  reset(): void {
    this.pendingJoin = null;
    this.pendingCreatedRoom = null;
    this.activeRoom = null;
  }

  private finishJoin(
    success: boolean,
    errorCode?: MultiplayerJoinErrorCode,
  ): boolean {
    if (!this.pendingJoin) {
      return false;
    }

    const pendingJoin = this.pendingJoin;
    this.pendingJoin = null;

    return this.sendJoinResult({
      gameId: pendingJoin.gameId,
      joinType: pendingJoin.joinType,
      success,
      waitMs: Math.max(0, Math.round(this.now() - pendingJoin.startedAt)),
      errorCode: success ? undefined : errorCode,
    });
  }
}

function normalizeConnectionStage(status: string): MultiplayerConnectionStage {
  return status === "playing" ? "playing" : "waiting";
}

function normalizeDisconnectErrorCode(
  socketReason: string,
): MultiplayerDisconnectErrorCode {
  switch (socketReason) {
    case "io server disconnect":
      return "server_disconnect";
    case "ping timeout":
      return "timeout";
    case "transport error":
      return "transport_error";
    default:
      return "network_error";
  }
}
