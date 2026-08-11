import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type {
  MultiplayerConnectionStatus,
  StopOpenRoomSummary,
  StopClientToServerEvents,
  StopServerToClientEvents,
} from "../Logic/multiplayer/protocol";
import type {
  StopMultiplayerSettingsPatch,
  StopMultiplayerState,
} from "../Logic/multiplayer/types";
import {
  clearActiveClassroomSession,
  getActiveClassroomSession,
  setActiveClassroomSession,
} from "../../Shared/Classrooms/activeClassroomSession";
import {
  getActivePlayerName,
  normalizePlayerName,
  setActivePlayerName,
} from "../../Shared/PlayerName/activePlayerName";
import { MultiplayerReliabilityTracker } from "../../analytics/MultiplayerReliabilityTracker";
import type { MultiplayerJoinType } from "../../analytics/events";

type MultiplayerSnapshot = {
  connectionStatus: MultiplayerConnectionStatus;
  roomCode: string | null;
  playerName: string;
  playerId: string | null;
  state: StopMultiplayerState | null;
  errorMessage: string | null;
  classroomCode: string | null;
  openClassroomRooms: StopOpenRoomSummary[];
};

type LeaveRoomOptions = {
  preserveName?: boolean;
};

const SESSION_STORAGE_KEY = "stop_multiplayer_session_v1";

const DEFAULT_SNAPSHOT: MultiplayerSnapshot = {
  connectionStatus: "idle",
  roomCode: null,
  playerName: getActivePlayerName(),
  playerId: null,
  state: null,
  errorMessage: null,
  classroomCode: null,
  openClassroomRooms: [],
};

let socket: Socket<
  StopServerToClientEvents,
  StopClientToServerEvents
> | null = null;
const reliabilityTracker = new MultiplayerReliabilityTracker();
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
      playerName: parsed.playerName || getActivePlayerName(),
      classroomCode: null,
      openClassroomRooms: [],
    };

    if (nextSnapshot.roomCode && nextSnapshot.connectionStatus !== "waiting") {
      nextSnapshot.connectionStatus =
        nextSnapshot.state?.status === "ended" ? "ended" : "disconnected";
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

  window.sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(sharedSnapshot),
  );
}

function notifySubscribers(): void {
  persistSnapshot();
  subscribers.forEach((listener) => listener(sharedSnapshot));
}

function updateSnapshot(patch: Partial<MultiplayerSnapshot>): void {
  sharedSnapshot = {
    ...sharedSnapshot,
    ...patch,
  };
  notifySubscribers();
}

function replaceSnapshot(nextSnapshot: MultiplayerSnapshot): void {
  sharedSnapshot = nextSnapshot;
  notifySubscribers();
}

function getServerUrl(): string | null {
  const serverUrl = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;
  return typeof serverUrl === "string" && serverUrl.trim().length > 0
    ? serverUrl
    : null;
}

function getNamespaceUrl(serverUrl: string): string {
  return `${serverUrl.replace(/\/$/, "")}/stop`;
}

function getConnectionStatusFromState(
  state: StopMultiplayerState | null,
): MultiplayerConnectionStatus {
  if (!state) {
    return sharedSnapshot.roomCode ? "disconnected" : "idle";
  }

  if (state.status === "ended") {
    return "ended";
  }

  return state.status === "playing" ? "playing" : "waiting";
}

function ensureSocket(): Socket<
  StopServerToClientEvents,
  StopClientToServerEvents
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
    socket = io(getNamespaceUrl(serverUrl), {
      autoConnect: false,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      updateSnapshot({
        connectionStatus: getConnectionStatusFromState(sharedSnapshot.state),
        errorMessage: null,
      });
      const classroom = getActiveClassroomSession();
      if (classroom) {
        socket?.emit("join_classroom", { code: classroom.code });
      }
    });

    socket.on("disconnect", (reason) => {
      reliabilityTracker.disconnected(reason, sharedSnapshot.connectionStatus);
      updateSnapshot({
        connectionStatus: sharedSnapshot.roomCode ? "disconnected" : "idle",
      });
    });

    socket.on("connect_error", (error) => {
      reliabilityTracker.failConnection("network_error");
      const message =
        error.message === "Invalid namespace"
          ? "O servidor online ainda não foi atualizado para o Stop Matemático."
          : "Não foi possível conectar ao servidor online.";

      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: message,
      });
    });

    socket.on("room_created", (payload) => {
      reliabilityTracker.roomCreated();
      updateSnapshot({
        roomCode: payload.code,
        playerId: payload.playerId,
        state: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        errorMessage: null,
      });
    });

    socket.on("room_joined", (payload) => {
      reliabilityTracker.joinSucceeded();
      updateSnapshot({
        roomCode: payload.code,
        playerId: payload.playerId,
        state: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        errorMessage: null,
      });
    });

    socket.on("state_updated", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        state: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        errorMessage: null,
      });
    });

    socket.on("player_removed", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        playerId: null,
        state: null,
        connectionStatus: "disconnected",
        errorMessage: payload.message,
      });
    });

    socket.on("room_closed", (payload) => {
      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: payload.message,
      });
    });

    socket.on("multiplayer_error", (payload) => {
      reliabilityTracker.failServer(payload.code);
      if (payload.code === "classroom_not_found") {
        clearActiveClassroomSession();
        updateSnapshot({ classroomCode: null, openClassroomRooms: [] });
      }
      const wasJoiningRoom =
        sharedSnapshot.connectionStatus === "connecting"
        && sharedSnapshot.playerId === null;

      updateSnapshot({
        roomCode: wasJoiningRoom ? null : sharedSnapshot.roomCode,
        connectionStatus: wasJoiningRoom ? "idle" : sharedSnapshot.connectionStatus,
        errorMessage: payload.message,
      });
    });

    socket.on("classroom_joined", (payload) => {
      if (payload.expiresAt) {
        setActiveClassroomSession({
          code: payload.classroomCode,
          expiresAt: payload.expiresAt,
        });
      }
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

export function hasActiveStopMultiplayerSession(): boolean {
  return sharedSnapshot.roomCode !== null;
}

export function leaveStopMultiplayerRoom(
  options: LeaveRoomOptions = {},
): void {
  const { preserveName = true } = options;
  reliabilityTracker.reset();

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

export function useStopMultiplayer() {
  const [snapshot, setSnapshot] = useState<MultiplayerSnapshot>(sharedSnapshot);

  useEffect(() => {
    if (!sharedSnapshot.roomCode) {
      const savedName = getActivePlayerName();
      if (savedName && savedName !== sharedSnapshot.playerName) {
        updateSnapshot({ playerName: savedName });
      }
    }
    setSnapshot(sharedSnapshot);

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
    const normalizedName = normalizePlayerName(playerName);
    if (normalizedName.length < 2) {
      updateSnapshot({
        errorMessage: "Digite um nome com pelo menos 2 letras.",
      });
      return;
    }
    reliabilityTracker.startRoomCreation(
      "stop_matematico",
      classroomCode ? "classroom_room" : "private_code",
    );
    setActivePlayerName(normalizedName);

    updateSnapshot({
      playerName: normalizedName,
      roomCode: null,
      playerId: null,
      state: null,
      connectionStatus: "connecting",
      errorMessage: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("create_room", {
      playerName: normalizedName,
      classroomCode,
    });
  };

  const joinRoom = (
    code: string,
    playerName: string,
    joinType: MultiplayerJoinType = "private_code",
  ) => {
    const normalizedName = normalizePlayerName(playerName);
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
    setActivePlayerName(normalizedName);
    reliabilityTracker.startJoin("stop_matematico", joinType);

    updateSnapshot({
      playerName: normalizedName,
      roomCode: null,
      playerId: null,
      state: null,
      connectionStatus: "connecting",
      errorMessage: null,
    });

    const activeSocket = ensureSocket();
    if (!activeSocket) {
      reliabilityTracker.failConnection("server_unavailable");
      return;
    }
    activeSocket.emit("join_room", {
      code: normalizedCode,
      playerName: normalizedName,
    });
  };

  const updateRoomSettings = (settingsPatch: StopMultiplayerSettingsPatch) => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

    const activeSocket = ensureSocket();
    activeSocket?.emit("update_room_settings", {
      code: sharedSnapshot.roomCode,
      settingsPatch,
    });
  };

  const startMatch = () => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

    const activeSocket = ensureSocket();
    activeSocket?.emit("start_match", {
      code: sharedSnapshot.roomCode,
    });
  };

  const removePlayer = (playerId: string) => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

    const activeSocket = ensureSocket();
    activeSocket?.emit("remove_player", {
      code: sharedSnapshot.roomCode,
      playerId,
    });
  };

  const submitAnswerSnapshot = (answers: string[]) => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

    const activeSocket = ensureSocket();
    activeSocket?.emit("submit_answer_snapshot", {
      code: sharedSnapshot.roomCode,
      answers,
    });
  };

  const pressStop = (answers: string[]) => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

    const activeSocket = ensureSocket();
    activeSocket?.emit("press_stop", {
      code: sharedSnapshot.roomCode,
      answers,
    });
  };

  const requestRematch = () => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

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
    updateRoomSettings,
    startMatch,
    removePlayer,
    submitAnswerSnapshot,
    pressStop,
    requestRematch,
    joinClassroom,
    leaveClassroom,
    leaveRoom: leaveStopMultiplayerRoom,
  };
}
