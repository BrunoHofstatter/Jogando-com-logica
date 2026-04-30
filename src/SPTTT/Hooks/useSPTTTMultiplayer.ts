import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type {
  MultiplayerConnectionStatus,
  PlayerSeat,
  RoomPlayerInfo,
  SptttClientToServerEvents,
  SptttServerToClientEvents,
} from "../Logic/multiplayer/protocol";
import type { MoveIntent, SptttPlayer, SptttState } from "../Logic/v2";

type MultiplayerSnapshot = {
  connectionStatus: MultiplayerConnectionStatus;
  roomCode: string | null;
  playerName: string;
  playerSeat: PlayerSeat | null;
  playerMark: SptttPlayer | null;
  players: RoomPlayerInfo[];
  gameState: SptttState | null;
  errorMessage: string | null;
  opponentDisconnected: boolean;
  rematchRequestedBy: PlayerSeat | null;
  rematchPending: boolean;
};

type LeaveRoomOptions = {
  preserveName?: boolean;
};

const SESSION_STORAGE_KEY = "spttt_multiplayer_session_v1";

const DEFAULT_SNAPSHOT: MultiplayerSnapshot = {
  connectionStatus: "idle",
  roomCode: null,
  playerName: "",
  playerSeat: null,
  playerMark: null,
  players: [],
  gameState: null,
  errorMessage: null,
  opponentDisconnected: false,
  rematchRequestedBy: null,
  rematchPending: false,
};

let socket: Socket<
  SptttServerToClientEvents,
  SptttClientToServerEvents
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
      players: Array.isArray(parsed.players) ? normalizePlayers(parsed.players) : [],
    };

    if (nextSnapshot.roomCode && nextSnapshot.connectionStatus !== "waiting") {
      nextSnapshot.connectionStatus =
        nextSnapshot.gameState?.status === "ended" ? "ended" : "disconnected";
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
  return `${serverUrl.replace(/\/$/, "")}/spttt`;
}

function ensureSocket(): Socket<
  SptttServerToClientEvents,
  SptttClientToServerEvents
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
          : sharedSnapshot.gameState?.status === "ended"
            ? "ended"
            : sharedSnapshot.connectionStatus === "waiting"
              ? "waiting"
              : "playing";

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
      const message =
        error.message === "Invalid namespace"
          ? "O servidor online ainda nÃ£o foi atualizado para o Super Jogo da Velha."
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
        playerMark: payload.mark,
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
        playerMark: payload.mark,
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

export function hasActiveSPTTTMultiplayerSession(): boolean {
  return sharedSnapshot.roomCode !== null;
}

export function leaveSPTTTMultiplayerRoom(
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

export function useSPTTTMultiplayer() {
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
      playerSeat: null,
      playerMark: null,
      players: [],
      gameState: null,
      connectionStatus: "connecting",
      errorMessage: null,
      opponentDisconnected: false,
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
      playerMark: null,
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

  return {
    ...snapshot,
    createRoom,
    joinRoom,
    submitMove,
    requestRematch,
    leaveRoom: leaveSPTTTMultiplayerRoom,
  };
}
