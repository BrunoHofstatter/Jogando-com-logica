import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type {
  CacaSomaClientToServerEvents,
  CacaSomaRoomSeat,
  CacaSomaRoomSettings,
  CacaSomaServerToClientEvents,
  MultiplayerConnectionStatus,
  PlayerIntent,
  RoomPlayerInfo,
} from "../Logic/multiplayer/protocol";
import type { CacaSomaMatchState } from "../Logic/v2";

type MultiplayerSnapshot = {
  connectionStatus: MultiplayerConnectionStatus;
  roomCode: string | null;
  playerName: string;
  playerSeat: CacaSomaRoomSeat | null;
  settings: CacaSomaRoomSettings | null;
  players: RoomPlayerInfo[];
  gameState: CacaSomaMatchState | null;
  errorMessage: string | null;
  playerLeftSeat: CacaSomaRoomSeat | null;
  roomInterrupted: boolean;
  rematchRequestedBy: CacaSomaRoomSeat | null;
  rematchPending: boolean;
};

type LeaveRoomOptions = {
  preserveName?: boolean;
};

const SESSION_STORAGE_KEY = "cacasoma_multiplayer_session_v1";

const DEFAULT_SETTINGS: CacaSomaRoomSettings = {
  difficultyId: "medium",
  targetScore: 3,
};

const DEFAULT_SNAPSHOT: MultiplayerSnapshot = {
  connectionStatus: "idle",
  roomCode: null,
  playerName: "",
  playerSeat: null,
  settings: null,
  players: [],
  gameState: null,
  errorMessage: null,
  playerLeftSeat: null,
  roomInterrupted: false,
  rematchRequestedBy: null,
  rematchPending: false,
};

let socket: Socket<
  CacaSomaServerToClientEvents,
  CacaSomaClientToServerEvents
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
      settings: parsed.settings ?? null,
      players: Array.isArray(parsed.players) ? normalizePlayers(parsed.players) : [],
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

function getNamespaceUrl(serverUrl: string): string {
  return `${serverUrl.replace(/\/$/, "")}/caca-soma`;
}

function getConnectionStatusFromState(
  state: CacaSomaMatchState | null,
): MultiplayerConnectionStatus {
  if (!state) {
    return sharedSnapshot.roomCode ? "waiting" : "idle";
  }

  return state.status === "ended" ? "ended" : "playing";
}

function ensureSocket(): Socket<
  CacaSomaServerToClientEvents,
  CacaSomaClientToServerEvents
> | null {
  const serverUrl = getServerUrl();

  if (!serverUrl) {
    updateSnapshot({
      connectionStatus: "disconnected",
      errorMessage: "O servidor online ainda nÃ£o foi configurado.",
    });
    return null;
  }

  if (!socket) {
    socket = io(getNamespaceUrl(serverUrl), {
      autoConnect: false,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      const nextStatus =
        sharedSnapshot.roomCode === null
          ? "idle"
          : getConnectionStatusFromState(sharedSnapshot.gameState);

      updateSnapshot({
        connectionStatus: nextStatus,
        errorMessage: null,
      });
    });

    socket.on("disconnect", () => {
      updateSnapshot({
        connectionStatus: sharedSnapshot.roomCode ? "disconnected" : "idle",
      });
    });

    socket.on("connect_error", (error) => {
      const message = error.message === "Invalid namespace"
        ? "O servidor online ainda nÃ£o foi atualizado para o CaÃ§a Soma."
        : "NÃ£o foi possÃ­vel conectar ao servidor online.";

      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: message,
      });
    });

    socket.on("room_created", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        playerSeat: payload.seat,
        settings: payload.settings,
        players: payload.players,
        gameState: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        playerLeftSeat: null,
        roomInterrupted: false,
        errorMessage: null,
        rematchPending: false,
        rematchRequestedBy: null,
      });
    });

    socket.on("room_joined", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        playerSeat: payload.seat,
        settings: payload.settings,
        players: payload.players,
        gameState: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        playerLeftSeat: null,
        roomInterrupted: false,
        errorMessage: null,
        rematchPending: false,
        rematchRequestedBy: null,
      });
    });

    socket.on("room_updated", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        settings: payload.settings,
        players: payload.players,
        gameState: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        errorMessage: null,
      });
    });

    socket.on("room_ready", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        settings: payload.settings,
        players: payload.players,
        gameState: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        playerLeftSeat: null,
        roomInterrupted: false,
        errorMessage: null,
        rematchPending: false,
        rematchRequestedBy: null,
      });
    });

    socket.on("state_updated", (payload) => {
      updateSnapshot({
        roomCode: payload.code,
        gameState: payload.state,
        connectionStatus: getConnectionStatusFromState(payload.state),
        errorMessage: null,
        playerLeftSeat: null,
        roomInterrupted: false,
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
        connectionStatus: getConnectionStatusFromState(payload.state),
        errorMessage: null,
        playerLeftSeat: null,
        roomInterrupted: false,
        rematchPending: false,
        rematchRequestedBy: null,
      });
    });

    socket.on("player_left", (payload) => {
      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: payload.message,
        playerLeftSeat: payload.seat,
        roomInterrupted: true,
      });
    });

    socket.on("room_closed", (payload) => {
      updateSnapshot({
        connectionStatus: "disconnected",
        errorMessage: payload.message,
        roomInterrupted: true,
      });
    });

    socket.on("multiplayer_error", (payload) => {
      updateSnapshot({
        connectionStatus: sharedSnapshot.roomCode ? sharedSnapshot.connectionStatus : "idle",
        errorMessage: payload.message,
      });
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function hasActiveCacaSomaMultiplayerSession(): boolean {
  return sharedSnapshot.roomCode !== null;
}

export function leaveCacaSomaMultiplayerRoom(
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

export function useCacaSomaMultiplayer() {
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

  const createRoom = (
    playerName: string,
  ) => {
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
      settings: DEFAULT_SETTINGS,
      players: [],
      gameState: null,
      connectionStatus: "connecting",
      errorMessage: null,
      playerLeftSeat: null,
      roomInterrupted: false,
      rematchPending: false,
      rematchRequestedBy: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("create_room", { playerName: normalizedName });
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
        errorMessage: "Digite um cÃ³digo de sala com 4 caracteres.",
      });
      return;
    }

    updateSnapshot({
      playerName: normalizedName,
      roomCode: normalizedCode,
      playerSeat: null,
      players: [],
      gameState: null,
      connectionStatus: "connecting",
      errorMessage: null,
      playerLeftSeat: null,
      roomInterrupted: false,
      rematchPending: false,
      rematchRequestedBy: null,
    });

    const activeSocket = ensureSocket();
    activeSocket?.emit("join_room", {
      code: normalizedCode,
      playerName: normalizedName,
    });
  };

  const submitAction = (intent: PlayerIntent) => {
    if (!sharedSnapshot.roomCode) {
      return;
    }

    const activeSocket = ensureSocket();
    activeSocket?.emit("submit_action", {
      code: sharedSnapshot.roomCode,
      intent,
    });
  };

  const updateRoomSettings = (settingsPatch: Partial<CacaSomaRoomSettings>) => {
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

  return {
    ...snapshot,
    createRoom,
    joinRoom,
    updateRoomSettings,
    startMatch,
    submitAction,
    requestRematch,
    leaveRoom: leaveCacaSomaMultiplayerRoom,
  };
}
