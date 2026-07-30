import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

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
import type { Level1Intent } from "../Logic/level1";
import type {
  BombGameClientToServerEvents,
  BombGameServerToClientEvents,
  BombGameViewState,
  OpenRoomSummary,
  PlayerSeat,
  RolePreference,
  RoomPlayerInfo,
} from "../Logic/multiplayer/protocol";

export type BombConnectionStatus = "idle" | "connecting" | "waiting" | "room" | "playing" | "ended" | "disconnected";

interface Snapshot {
  connectionStatus: BombConnectionStatus;
  roomCode: string | null;
  playerName: string;
  playerSeat: PlayerSeat | null;
  players: RoomPlayerInfo[];
  gameState: BombGameViewState | null;
  classroomCode: string | null;
  openClassroomRooms: OpenRoomSummary[];
  errorMessage: string | null;
  opponentDisconnected: boolean;
}

const DEFAULT_SNAPSHOT: Snapshot = {
  connectionStatus: "idle",
  roomCode: null,
  playerName: getActivePlayerName(),
  playerSeat: null,
  players: [],
  gameState: null,
  classroomCode: getActiveClassroomSession()?.code ?? null,
  openClassroomRooms: [],
  errorMessage: null,
  opponentDisconnected: false,
};

let sharedSnapshot = DEFAULT_SNAPSHOT;
let socket: Socket<BombGameServerToClientEvents, BombGameClientToServerEvents> | null = null;
let actionSequence = 0;
const subscribers = new Set<(value: Snapshot) => void>();

function updateSnapshot(patch: Partial<Snapshot>): void {
  sharedSnapshot = { ...sharedSnapshot, ...patch };
  subscribers.forEach((listener) => listener(sharedSnapshot));
}

function getServerUrl(): string | null {
  const value = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function ensureSocket(): typeof socket {
  const serverUrl = getServerUrl();
  if (!serverUrl) {
    updateSnapshot({ connectionStatus: "disconnected", errorMessage: "O servidor online ainda não foi configurado." });
    return null;
  }
  if (socket) return socket;

  socket = io(`${serverUrl.replace(/\/$/, "")}/bomb-game`, { autoConnect: false, transports: ["websocket"] });
  socket.on("connect", () => {
    updateSnapshot({ connectionStatus: sharedSnapshot.roomCode ? sharedSnapshot.connectionStatus : "idle", errorMessage: null });
    const classroom = getActiveClassroomSession();
    if (classroom) socket?.emit("join_classroom", { code: classroom.code });
  });
  socket.on("disconnect", () => updateSnapshot({ connectionStatus: sharedSnapshot.roomCode ? "disconnected" : "idle" }));
  socket.on("connect_error", () => updateSnapshot({ connectionStatus: "disconnected", errorMessage: "Não foi possível conectar ao servidor online." }));

  socket.on("room_created", (payload) => updateSnapshot({
    roomCode: payload.code,
    playerSeat: payload.seat,
    players: payload.players,
    gameState: payload.state,
    connectionStatus: "waiting",
    errorMessage: null,
    opponentDisconnected: false,
  }));
  socket.on("room_joined", (payload) => updateSnapshot({
    roomCode: payload.code,
    playerSeat: payload.seat,
    players: payload.players,
    gameState: payload.state,
    connectionStatus: "room",
    errorMessage: null,
    opponentDisconnected: false,
  }));
  socket.on("state_updated", ({ players, state }) => updateSnapshot({
    players,
    gameState: state,
    connectionStatus: resolveStatus(players, state),
    errorMessage: null,
    opponentDisconnected: players.some((player) => !player.connected),
  }));
  socket.on("opponent_left", ({ message }) => updateSnapshot({ opponentDisconnected: true, errorMessage: message }));
  socket.on("room_closed", ({ message }) => {
    socket?.disconnect();
    socket = null;
    updateSnapshot({ ...DEFAULT_SNAPSHOT, playerName: getActivePlayerName(), classroomCode: getActiveClassroomSession()?.code ?? null, errorMessage: message });
  });
  socket.on("multiplayer_error", ({ message }) => updateSnapshot({ errorMessage: message }));
  socket.on("classroom_joined", ({ classroomCode, expiresAt, openRooms }) => {
    setActiveClassroomSession({ code: classroomCode, expiresAt });
    updateSnapshot({ classroomCode, openClassroomRooms: openRooms, errorMessage: null });
  });
  socket.on("classroom_rooms_updated", ({ classroomCode, openRooms }) => {
    if (sharedSnapshot.classroomCode === classroomCode) updateSnapshot({ openClassroomRooms: openRooms });
  });
  socket.on("classroom_unavailable", ({ classroomCode, message }) => {
    if (sharedSnapshot.classroomCode !== classroomCode) return;
    clearActiveClassroomSession();
    updateSnapshot({ classroomCode: null, openClassroomRooms: [], errorMessage: message });
  });
  socket.connect();
  return socket;
}

function resolveStatus(players: RoomPlayerInfo[], state: BombGameViewState | null): BombConnectionStatus {
  if (players.length < 2) return "waiting";
  if (!state) return "room";
  if (["won", "lost", "replay_countdown"].includes(state.phase)) return "ended";
  return "playing";
}

export function useBombGameMultiplayer() {
  const [snapshot, setSnapshot] = useState(sharedSnapshot);
  useEffect(() => {
    const savedName = getActivePlayerName();
    const classroom = getActiveClassroomSession();
    updateSnapshot({ playerName: savedName, classroomCode: classroom?.code ?? null });
    setSnapshot(sharedSnapshot);
    subscribers.add(setSnapshot);
    if (classroom) ensureSocket();
    return () => { subscribers.delete(setSnapshot); };
  }, []);

  const createRoom = (playerName: string, hintsEnabled: boolean, classroomCode?: string) => {
    const name = normalizePlayerName(playerName);
    if (name.length < 2) return updateSnapshot({ errorMessage: "Digite um nome com pelo menos 2 letras." });
    setActivePlayerName(name);
    updateSnapshot({ playerName: name, roomCode: null, playerSeat: null, players: [], gameState: null, connectionStatus: "connecting", errorMessage: null, opponentDisconnected: false });
    ensureSocket()?.emit("create_room", { playerName: name, hintsEnabled, classroomCode });
  };

  const joinRoom = (code: string, playerName: string) => {
    const name = normalizePlayerName(playerName);
    const normalizedCode = code.trim().toUpperCase();
    if (name.length < 2) return updateSnapshot({ errorMessage: "Digite um nome com pelo menos 2 letras." });
    if (normalizedCode.length !== 4) return updateSnapshot({ errorMessage: "Digite um código de sala com 4 caracteres." });
    setActivePlayerName(name);
    updateSnapshot({ playerName: name, roomCode: null, playerSeat: null, players: [], gameState: null, connectionStatus: "connecting", errorMessage: null, opponentDisconnected: false });
    ensureSocket()?.emit("join_room", { code: normalizedCode, playerName: name });
  };

  const joinClassroom = (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length !== 4) return updateSnapshot({ errorMessage: "Digite um código de turma com 4 letras." });
    ensureSocket()?.emit("join_classroom", { code: normalizedCode });
  };

  const leaveClassroom = () => {
    if (socket && sharedSnapshot.classroomCode) socket.emit("leave_classroom", { code: sharedSnapshot.classroomCode });
    clearActiveClassroomSession();
    updateSnapshot({ classroomCode: null, openClassroomRooms: [], errorMessage: null });
  };

  return {
    ...snapshot,
    createRoom,
    joinRoom,
    joinClassroom,
    leaveClassroom,
    setPreference: (preference: RolePreference) => { if (sharedSnapshot.roomCode) ensureSocket()?.emit("set_role_preference", { code: sharedSnapshot.roomCode, preference }); },
    setReady: (ready: boolean) => { if (sharedSnapshot.roomCode) ensureSocket()?.emit("set_ready", { code: sharedSnapshot.roomCode, ready }); },
    submit: (intent: Level1Intent) => { if (sharedSnapshot.roomCode) ensureSocket()?.emit("submit_action", { code: sharedSnapshot.roomCode, actionId: `${Date.now()}-${actionSequence += 1}`, intent }); },
    setReplayVote: (wantsReplay: boolean) => { if (sharedSnapshot.roomCode) ensureSocket()?.emit("set_replay_vote", { code: sharedSnapshot.roomCode, wantsReplay }); },
    clearError: () => updateSnapshot({ errorMessage: null }),
    leaveRoom: leaveBombGameRoom,
  };
}

export function hasActiveBombGameSession(): boolean { return Boolean(sharedSnapshot.roomCode); }

export function leaveBombGameRoom(): void {
  if (sharedSnapshot.roomCode) socket?.emit("leave_room", { code: sharedSnapshot.roomCode });
  socket?.disconnect();
  socket = null;
  updateSnapshot({ ...DEFAULT_SNAPSHOT, playerName: getActivePlayerName(), classroomCode: getActiveClassroomSession()?.code ?? null });
}
