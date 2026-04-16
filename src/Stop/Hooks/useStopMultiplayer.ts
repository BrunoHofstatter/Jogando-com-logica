import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type {
  MultiplayerConnectionStatus,
  StopClientToServerEvents,
  StopServerToClientEvents,
} from "../Logic/multiplayer/protocol";
import type {
  StopMultiplayerSettingsPatch,
  StopMultiplayerState,
} from "../Logic/multiplayer/types";

type MultiplayerSnapshot = {
  connectionStatus: MultiplayerConnectionStatus;
  roomCode: string | null;
  playerName: string;
  playerId: string | null;
  state: StopMultiplayerState | null;
  errorMessage: string | null;
};

type LeaveRoomOptions = {
  preserveName?: boolean;
};

const SESSION_STORAGE_KEY = "stop_multiplayer_session_v1";

const DEFAULT_SNAPSHOT: MultiplayerSnapshot = {
  connectionStatus: "idle",
  roomCode: null,
  playerName: "",
  playerId: null,
  state: null,
  errorMessage: null,
};

let socket: Socket<
  StopServerToClientEvents,
  StopClientToServerEvents
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
    });

    socket.on("disconnect", () => {
      updateSnapshot({
        connectionStatus: sharedSnapshot.roomCode ? "disconnected" : "idle",
      });
    });

    socket.on("connect_error", (error) => {
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
      updateSnapshot({
        roomCode: payload.code,
        playerId: payload.playerId,
        state: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        errorMessage: null,
      });
    });

    socket.on("room_joined", (payload) => {
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

    socket.on("room_closed", (payload) => {
      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: payload.message,
      });
    });

    socket.on("multiplayer_error", (payload) => {
      updateSnapshot({
        connectionStatus: sharedSnapshot.roomCode
          ? sharedSnapshot.connectionStatus
          : "idle",
        errorMessage: payload.message,
      });
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
    const listener = (nextSnapshot: MultiplayerSnapshot) => {
      setSnapshot(nextSnapshot);
    };

    subscribers.add(listener);

    return () => {
      subscribers.delete(listener);
    };
  }, []);

  const createRoom = (playerName: string) => {
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
      playerId: null,
      state: null,
      connectionStatus: "connecting",
      errorMessage: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("create_room", {
      playerName: normalizedName,
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
      roomCode: normalizedCode,
      playerId: null,
      state: null,
      connectionStatus: "connecting",
      errorMessage: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("join_room", {
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

  return {
    ...snapshot,
    createRoom,
    joinRoom,
    updateRoomSettings,
    startMatch,
    submitAnswerSnapshot,
    pressStop,
    requestRematch,
    leaveRoom: leaveStopMultiplayerRoom,
  };
}
