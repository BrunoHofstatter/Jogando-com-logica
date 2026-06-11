import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type {
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents,
  MultiplayerConnectionStatus,
  OpenRoomSummary,
  RoomPlayerInfo,
} from "../Logic/multiplayer/protocol";
import type { CrownChaseState, MoveIntent, PlayerId } from "../Logic/v2";
import {
  clearActiveClassroomSession,
  getActiveClassroomSession,
  setActiveClassroomSession,
} from "../../Shared/Classrooms/activeClassroomSession";

type MultiplayerSnapshot = {
  connectionStatus: MultiplayerConnectionStatus;
  roomCode: string | null;
  playerName: string;
  playerSeat: PlayerId | null;
  players: RoomPlayerInfo[];
  gameState: CrownChaseState | null;
  errorMessage: string | null;
  opponentDisconnected: boolean;
  rematchRequestedBy: PlayerId | null;
  rematchPending: boolean;
  classroomCode: string | null;
  openClassroomRooms: OpenRoomSummary[];
};

type LeaveRoomOptions = {
  preserveName?: boolean;
};

const SESSION_STORAGE_KEY = "crownchase_multiplayer_session_v1";

const DEFAULT_SNAPSHOT: MultiplayerSnapshot = {
  connectionStatus: "idle",
  roomCode: null,
  playerName: "",
  playerSeat: null,
  players: [],
  gameState: null,
  errorMessage: null,
  opponentDisconnected: false,
  rematchRequestedBy: null,
  rematchPending: false,
  classroomCode: null,
  openClassroomRooms: [],
};

let socket: Socket<
  CrownChaseServerToClientEvents,
  CrownChaseClientToServerEvents
> | null = null;
let sharedSnapshot = loadSnapshot();
const subscribers = new Set<(snapshot: MultiplayerSnapshot) => void>();

function loadSnapshot(): MultiplayerSnapshot {
  if (typeof window === "undefined") {
    return DEFAULT_SNAPSHOT;
  }

  try {
    const rawValue = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_SNAPSHOT;
    }

    const parsed = JSON.parse(rawValue) as Partial<MultiplayerSnapshot>;
    const nextSnapshot: MultiplayerSnapshot = {
      ...DEFAULT_SNAPSHOT,
      ...parsed,
      classroomCode: null,
      players: Array.isArray(parsed.players) ? normalizePlayers(parsed.players) : [],
      openClassroomRooms: [],
    };

    if (nextSnapshot.roomCode && nextSnapshot.connectionStatus !== "waiting") {
      nextSnapshot.connectionStatus = nextSnapshot.gameState?.status === "ended"
        ? "ended"
        : "disconnected";
    }

    return nextSnapshot;
  } catch {
    return DEFAULT_SNAPSHOT;
  }
}

function persistSnapshot(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sharedSnapshot));
}

function notifySubscribers(): void {
  persistSnapshot();
  subscribers.forEach((listener) => listener(sharedSnapshot));
}

function updateSnapshot(patch: Partial<MultiplayerSnapshot>): void {
  sharedSnapshot = {
    ...sharedSnapshot,
    ...patch,
    players: patch.players ? normalizePlayers(patch.players) : sharedSnapshot.players,
  };
  notifySubscribers();
}

function replaceSnapshot(nextSnapshot: MultiplayerSnapshot): void {
  sharedSnapshot = {
    ...nextSnapshot,
    players: normalizePlayers(nextSnapshot.players),
  };
  notifySubscribers();
}

function normalizePlayers(players: RoomPlayerInfo[]): RoomPlayerInfo[] {
  return [...players].sort((left, right) => left.seat - right.seat);
}

function getServerUrl(): string | null {
  const serverUrl = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;
  return typeof serverUrl === "string" && serverUrl.trim().length > 0
    ? serverUrl
    : null;
}

function ensureSocket(): Socket<
  CrownChaseServerToClientEvents,
  CrownChaseClientToServerEvents
> | null {
  const serverUrl = getServerUrl();

  if (!serverUrl) {
    updateSnapshot({
      connectionStatus: "disconnected",
      errorMessage: "O servidor online ainda não foi configurado.",
    });
    return null;
  }

  if (!socket) {
    socket = io(serverUrl, {
      autoConnect: false,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      const nextStatus =
        sharedSnapshot.roomCode === null
          ? "idle"
          : sharedSnapshot.gameState?.status === "ended"
            ? "ended"
            : sharedSnapshot.connectionStatus === "waiting"
              ? "waiting"
              : "playing";

      updateSnapshot({
        connectionStatus: nextStatus,
        errorMessage: null,
      });
      const classroom = getActiveClassroomSession();
      if (classroom) {
        socket?.emit("join_classroom", { code: classroom.code });
      }
    });

    socket.on("disconnect", () => {
      updateSnapshot({
        connectionStatus: sharedSnapshot.roomCode ? "disconnected" : "idle",
      });
    });

    socket.on("connect_error", (error) => {
      const message = error.message === "Invalid namespace"
        ? "O servidor online ainda não foi atualizado para o Caça Coroa."
        : "Não foi possível conectar ao servidor online.";

      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: message,
      });
    });

    socket.on("room_created", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        playerSeat: payload.seat,
        players: payload.players,
        gameState: payload.state,
        connectionStatus: "waiting",
        opponentDisconnected: false,
        errorMessage: null,
        rematchPending: false,
        rematchRequestedBy: null,
      });
    });

    socket.on("room_joined", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        playerSeat: payload.seat,
        players: payload.players,
        gameState: payload.state,
        connectionStatus: "waiting",
        opponentDisconnected: false,
        errorMessage: null,
        rematchPending: false,
        rematchRequestedBy: null,
      });
    });

    socket.on("room_ready", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        players: payload.players,
        gameState: payload.state,
        connectionStatus: payload.state.status === "ended" ? "ended" : "playing",
        opponentDisconnected: false,
        errorMessage: null,
        rematchPending: false,
        rematchRequestedBy: null,
      });
    });

    socket.on("state_updated", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        gameState: payload.state,
        connectionStatus: payload.state.status === "ended" ? "ended" : "playing",
        errorMessage: null,
        opponentDisconnected: false,
      });
    });

    socket.on("rematch_requested", (payload) => {
      updateSnapshot({
        rematchRequestedBy: payload.requestedBy,
        rematchPending: sharedSnapshot.playerSeat === payload.requestedBy,
        errorMessage: null,
      });
    });

    socket.on("rematch_started", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        gameState: payload.state,
        connectionStatus: "playing",
        errorMessage: null,
        opponentDisconnected: false,
        rematchPending: false,
        rematchRequestedBy: null,
      });
    });

    socket.on("opponent_left", (payload) => {
      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: payload.message,
        opponentDisconnected: true,
      });
    });

    socket.on("room_closed", (payload) => {
      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: payload.message,
        opponentDisconnected: true,
      });
    });

    socket.on("multiplayer_error", (payload) => {
      if (payload.code === "classroom_not_found") {
        clearActiveClassroomSession();
        updateSnapshot({ classroomCode: null, openClassroomRooms: [] });
      }
      const wasJoiningRoom =
        sharedSnapshot.connectionStatus === "connecting"
        && sharedSnapshot.playerSeat === null;

      updateSnapshot({
        roomCode: wasJoiningRoom ? null : sharedSnapshot.roomCode,
        connectionStatus: wasJoiningRoom ? "idle" : sharedSnapshot.connectionStatus,
        errorMessage: payload.message,
      });
    });

    socket.on("classroom_joined", (payload) => {
      setActiveClassroomSession({
        code: payload.classroomCode,
        expiresAt: payload.expiresAt,
      });
      updateSnapshot({
        classroomCode: payload.classroomCode,
        openClassroomRooms: payload.openRooms,
        errorMessage: null,
      });
    });

    socket.on("classroom_rooms_updated", (payload) => {
      if (payload.classroomCode !== sharedSnapshot.classroomCode) {
        return;
      }

      updateSnapshot({
        openClassroomRooms: payload.openRooms,
        errorMessage: null,
      });
    });

    socket.on("classroom_unavailable", (payload) => {
      if (payload.classroomCode !== sharedSnapshot.classroomCode) {
        return;
      }

      updateSnapshot({
        classroomCode: null,
        openClassroomRooms: [],
        errorMessage: payload.message,
      });
      clearActiveClassroomSession();
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function hasActiveCrownChaseMultiplayerSession(): boolean {
  return sharedSnapshot.roomCode !== null;
}

export function leaveCrownChaseMultiplayerRoom(
  options: LeaveRoomOptions = {},
): void {
  const { preserveName = true } = options;

  if (socket && sharedSnapshot.roomCode) {
    socket.emit("leave_room", { code: sharedSnapshot.roomCode });
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  replaceSnapshot({
    ...DEFAULT_SNAPSHOT,
    playerName: preserveName ? sharedSnapshot.playerName : "",
  });
}

export function useCrownChaseMultiplayer() {
  const [snapshot, setSnapshot] = useState<MultiplayerSnapshot>(sharedSnapshot);

  useEffect(() => {
    const listener = (nextSnapshot: MultiplayerSnapshot) => {
      setSnapshot(nextSnapshot);
    };

    subscribers.add(listener);
    if (getActiveClassroomSession()) {
      ensureSocket();
    }

    return () => {
      subscribers.delete(listener);
    };
  }, []);

  const createRoom = (playerName: string, classroomCode?: string) => {
    const normalizedName = playerName.trim().slice(0, 20);
    if (normalizedName.length < 2) {
      updateSnapshot({
        errorMessage: "Digite um nome com pelo menos 2 letras.",
      });
      return;
    }

    updateSnapshot({
      playerName: normalizedName,
      roomCode: null,
      playerSeat: null,
      players: [],
      gameState: null,
      connectionStatus: "connecting",
      errorMessage: null,
      opponentDisconnected: false,
      rematchPending: false,
      rematchRequestedBy: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("create_room", {
      playerName: normalizedName,
      classroomCode,
    });
  };

  const joinRoom = (code: string, playerName: string) => {
    const normalizedName = playerName.trim().slice(0, 20);
    const normalizedCode = code.trim().toUpperCase();

    if (normalizedName.length < 2) {
      updateSnapshot({
        errorMessage: "Digite um nome com pelo menos 2 letras.",
      });
      return;
    }

    if (normalizedCode.length !== 4) {
      updateSnapshot({
        errorMessage: "Digite um código de sala com 4 caracteres.",
      });
      return;
    }

    updateSnapshot({
      playerName: normalizedName,
      roomCode: null,
      playerSeat: null,
      players: [],
      gameState: null,
      connectionStatus: "connecting",
      errorMessage: null,
      opponentDisconnected: false,
      rematchPending: false,
      rematchRequestedBy: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("join_room", {
      code: normalizedCode,
      playerName: normalizedName,
    });
  };

  const submitMove = (intent: MoveIntent) => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

    const activeSocket = ensureSocket();
    activeSocket?.emit("submit_move", {
      code: sharedSnapshot.roomCode,
      intent,
    });
  };

  const requestRematch = () => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

    updateSnapshot({
      rematchPending: true,
      rematchRequestedBy: sharedSnapshot.playerSeat,
      errorMessage: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("request_rematch", {
      code: sharedSnapshot.roomCode,
    });
  };

  const joinClassroom = (classroomCode: string) => {
    const normalizedCode = classroomCode.trim().toUpperCase();
    if (normalizedCode.length !== 4) {
      updateSnapshot({
        errorMessage: "Digite um código de turma com 4 letras.",
      });
      return;
    }

    updateSnapshot({
      errorMessage: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("join_classroom", { code: normalizedCode });
  };

  const leaveClassroom = () => {
    if (socket && sharedSnapshot.classroomCode) {
      socket.emit("leave_classroom", { code: sharedSnapshot.classroomCode });
    }

    updateSnapshot({
      classroomCode: null,
      openClassroomRooms: [],
      errorMessage: null,
    });
    clearActiveClassroomSession();
  };

  return {
    ...snapshot,
    createRoom,
    joinRoom,
    submitMove,
    requestRematch,
    joinClassroom,
    leaveClassroom,
    leaveRoom: leaveCrownChaseMultiplayerRoom,
  };
}
