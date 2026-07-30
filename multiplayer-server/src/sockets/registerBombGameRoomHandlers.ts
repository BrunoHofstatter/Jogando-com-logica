import type { Namespace, Socket } from "socket.io";

import {
  applyLevel1Intent,
  createLevel1State,
  type BombRole,
  type Level1State,
} from "../../../src/BombGame/Logic/level1.ts";
import type {
  BombGameClientToServerEvents,
  BombGameServerToClientEvents,
  BombGameViewState,
  ClassroomCode,
  OpenRoomSummary,
  PlayerSeat,
  RolePreference,
  RoomPlayerInfo,
} from "../../../src/BombGame/Logic/multiplayer/protocol.ts";
import { assignBombRoles, updateReplayVotes } from "../../../src/BombGame/Logic/roomRules.ts";
import type { ClassroomStore } from "../classrooms/classroomStore.ts";
import type { ClassroomMonitor } from "../classrooms/classroomMonitor.ts";
import { generateRoomCode } from "../rooms/roomCode.ts";
import { DISCONNECT_GRACE_MS, WAITING_ROOM_TTL_MS } from "../rooms/roomTypes.ts";

type BombNamespace = Namespace<BombGameClientToServerEvents, BombGameServerToClientEvents>;
type BombSocket = Socket<BombGameClientToServerEvents, BombGameServerToClientEvents>;

interface Player {
  socketId: string;
  seat: PlayerSeat;
  name: string;
  connected: boolean;
  preference: RolePreference;
  role: BombRole | null;
  ready: boolean;
}

interface Room {
  code: string;
  players: [Player | null, Player | null];
  visibility: "private" | "classroom";
  classroomCode: ClassroomCode | null;
  hintsEnabled: boolean;
  phase: "role_selection" | "countdown" | "playing" | "won" | "lost" | "replay_countdown";
  lives: number;
  level: Level1State;
  countdownEndsAt: number | null;
  timerEndsAt: number | null;
  replayCountdownEndsAt: number | null;
  resultReason: "completed" | "lives" | "time" | null;
  createdAt: number;
  replayVotes: Set<PlayerSeat>;
  processedActionIds: Set<string>;
  waitingTimeout: NodeJS.Timeout | null;
  countdownTimeout: NodeJS.Timeout | null;
  roundTimeout: NodeJS.Timeout | null;
  replayTimeout: NodeJS.Timeout | null;
  closeTimeout: NodeJS.Timeout | null;
}

const rooms = new Map<string, Room>();
let activeClassroomMonitor: ClassroomMonitor;
const COUNTDOWN_MS = 3_000;
const REPLAY_COUNTDOWN_MS = 3_000;
const LEVEL_DURATION_MS = 3 * 60_000;

export function registerBombGameRoomHandlers(
  io: BombNamespace,
  classroomStore: ClassroomStore,
  classroomMonitor: ClassroomMonitor,
): void {
  activeClassroomMonitor = classroomMonitor;
  classroomMonitor.registerProvider("bomb_game", (classroomCode) =>
    [...rooms.values()]
      .filter((room) => room.visibility === "classroom" && room.classroomCode === classroomCode)
      .map((room) => ({
        code: room.code,
        game: "bomb_game",
        status: room.phase === "role_selection"
          ? "waiting"
          : room.phase === "won" || room.phase === "lost"
            ? "ended"
            : "playing",
        players: playersFor(room).map(({ name, connected }) => ({ name, connected })),
        capacity: 2,
        createdAt: room.createdAt,
      })),
  );

  io.on("connection", (socket) => {
    socket.on("create_room", ({ playerName, hintsEnabled, classroomCode }) => {
      leaveExistingRoom(io, socket);
      const name = normalizeName(playerName);
      if (!name) return emitError(socket, "invalid_name", "Digite um nome com pelo menos 2 letras.");
      const normalizedClassroomCode = classroomCode ? normalizeClassroomCode(classroomCode) : null;
      if (classroomCode && (!normalizedClassroomCode || !classroomStore.getClassroom(normalizedClassroomCode))) {
        return emitError(socket, "classroom_not_found", "Turma não encontrada.");
      }

      const code = generateRoomCode(new Set(rooms.keys()));
      const room: Room = {
        code,
        players: [createPlayer(socket.id, 0, name), null],
        visibility: normalizedClassroomCode ? "classroom" : "private",
        classroomCode: normalizedClassroomCode,
        hintsEnabled: Boolean(hintsEnabled),
        phase: "role_selection",
        lives: 3,
        level: createLevel1State(),
        countdownEndsAt: null,
        timerEndsAt: null,
        replayCountdownEndsAt: null,
        resultReason: null,
        createdAt: Date.now(),
        replayVotes: new Set(),
        processedActionIds: new Set(),
        waitingTimeout: null,
        countdownTimeout: null,
        roundTimeout: null,
        replayTimeout: null,
        closeTimeout: null,
      };
      rooms.set(code, room);
      socket.join(code);
      room.waitingTimeout = setTimeout(() => closeRoom(io, room, "A sala expirou porque ninguém entrou a tempo."), WAITING_ROOM_TTL_MS);
      socket.emit("room_created", roomPayload(room, 0));
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("join_room", ({ code: rawCode, playerName }) => {
      leaveExistingRoom(io, socket);
      const code = rawCode.trim().toUpperCase();
      const name = normalizeName(playerName);
      if (!name) return emitError(socket, "invalid_name", "Digite um nome com pelo menos 2 letras.");
      const room = rooms.get(code);
      if (!room) return emitError(socket, "room_not_found", "Sala não encontrada.");
      if (room.phase !== "role_selection" || room.players[1]) return emitError(socket, "room_full", "Essa sala não está disponível.");
      room.players[1] = createPlayer(socket.id, 1, name);
      if (room.waitingTimeout) clearTimeout(room.waitingTimeout);
      room.waitingTimeout = null;
      socket.join(code);
      socket.emit("room_joined", roomPayload(room, 1));
      broadcast(io, room);
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("join_classroom", ({ code }) => {
      const normalizedCode = normalizeClassroomCode(code);
      const classroom = normalizedCode ? classroomStore.getClassroom(normalizedCode) : undefined;
      if (!normalizedCode || !classroom) return emitError(socket, "classroom_not_found", "Turma não encontrada.");
      socket.join(classroomChannel(normalizedCode));
      socket.emit("classroom_joined", { classroomCode: normalizedCode, expiresAt: classroom.expiresAt, openRooms: getOpenClassroomRooms(normalizedCode) });
    });

    socket.on("leave_classroom", ({ code }) => {
      const normalizedCode = normalizeClassroomCode(code);
      if (normalizedCode) socket.leave(classroomChannel(normalizedCode));
    });

    socket.on("list_open_rooms", ({ classroomCode }) => {
      const normalizedCode = normalizeClassroomCode(classroomCode);
      if (!normalizedCode || !classroomStore.getClassroom(normalizedCode)) return emitError(socket, "classroom_not_found", "Turma não encontrada.");
      socket.join(classroomChannel(normalizedCode));
      socket.emit("classroom_rooms_updated", { classroomCode: normalizedCode, openRooms: getOpenClassroomRooms(normalizedCode) });
    });

    socket.on("set_role_preference", ({ code, preference }) => {
      const found = authorizedRoom(socket, code);
      if (!found || found.room.phase !== "role_selection" || !["bomb", "manual", "either"].includes(preference)) return;
      found.player.preference = preference;
      found.player.ready = false;
      broadcast(io, found.room);
    });

    socket.on("set_ready", ({ code, ready }) => {
      const found = authorizedRoom(socket, code);
      if (!found || found.room.phase !== "role_selection" || !found.room.players[0] || !found.room.players[1]) return;
      found.player.ready = Boolean(ready);
      if (found.room.players.every((player) => player?.ready)) startRoleCountdown(io, found.room);
      else broadcast(io, found.room);
    });

    socket.on("submit_action", ({ code, actionId, intent }) => {
      const found = authorizedRoom(socket, code);
      if (!found || found.room.phase !== "playing" || found.player.role !== "bomb") return;
      const actionKey = `${found.player.seat}:${actionId}`;
      if (!actionId || found.room.processedActionIds.has(actionKey)) return;
      found.room.processedActionIds.add(actionKey);
      const result = applyLevel1Intent(found.room.level, intent);
      if (!result.accepted) return;
      if (result.mistake) {
        found.room.lives -= 1;
        if (found.room.lives === 0) endRound(io, found.room, "lost", "lives");
      }
      if (result.completed) endRound(io, found.room, "won", "completed");
      if (found.room.phase === "playing") broadcast(io, found.room);
    });

    socket.on("set_replay_vote", ({ code, wantsReplay }) => {
      const found = authorizedRoom(socket, code);
      if (!found || !["won", "lost"].includes(found.room.phase)) return;
      found.room.replayVotes = new Set(updateReplayVotes([...found.room.replayVotes], found.player.seat, wantsReplay));
      if (found.room.replayVotes.size === 2) startReplayCountdown(io, found.room);
      else broadcast(io, found.room);
    });

    socket.on("leave_room", ({ code }) => {
      const found = authorizedRoom(socket, code);
      if (found) closeRoom(io, found.room, "Seu parceiro saiu da sala.");
    });

    socket.on("disconnect", () => {
      const found = findBySocket(socket.id);
      if (!found) return;
      found.player.connected = false;
      const other = found.room.players.find((player) => player && player.seat !== found.player.seat);
      if (other) io.to(other.socketId).emit("opponent_left", { code: found.room.code, message: "Seu parceiro desconectou. O tempo continua correndo." });
      found.room.closeTimeout = setTimeout(() => closeRoom(io, found.room, "A sala foi encerrada porque o parceiro não voltou."), DISCONNECT_GRACE_MS);
      broadcast(io, found.room);
      broadcastClassroomRooms(io, found.room.classroomCode);
    });
  });
}

function startRoleCountdown(io: BombNamespace, room: Room): void {
  assignRoles(room);
  room.phase = "countdown";
  room.countdownEndsAt = Date.now() + COUNTDOWN_MS;
  broadcast(io, room);
  room.countdownTimeout = setTimeout(() => {
    if (!rooms.has(room.code) || room.phase !== "countdown") return;
    room.phase = "playing";
    room.countdownEndsAt = null;
    room.timerEndsAt = Date.now() + LEVEL_DURATION_MS;
    broadcast(io, room);
    room.roundTimeout = setTimeout(() => endRound(io, room, "lost", "time"), LEVEL_DURATION_MS);
  }, COUNTDOWN_MS);
}

function startReplayCountdown(io: BombNamespace, room: Room): void {
  room.phase = "replay_countdown";
  room.replayCountdownEndsAt = Date.now() + REPLAY_COUNTDOWN_MS;
  broadcast(io, room);
  room.replayTimeout = setTimeout(() => {
    if (!rooms.has(room.code) || room.phase !== "replay_countdown") return;
    room.phase = "role_selection";
    room.lives = 3;
    room.level = createLevel1State();
    room.countdownEndsAt = null;
    room.timerEndsAt = null;
    room.replayCountdownEndsAt = null;
    room.resultReason = null;
    room.replayVotes.clear();
    room.processedActionIds.clear();
    room.players.forEach((player) => { if (player) { player.ready = false; player.role = null; } });
    broadcast(io, room);
  }, REPLAY_COUNTDOWN_MS);
}

function assignRoles(room: Room): void {
  const first = room.players[0]!;
  const second = room.players[1]!;
  [first.role, second.role] = assignBombRoles(first.preference, second.preference);
}

function endRound(io: BombNamespace, room: Room, phase: "won" | "lost", reason: Room["resultReason"]): void {
  if (room.phase !== "playing") return;
  room.phase = phase;
  room.resultReason = reason;
  room.timerEndsAt = null;
  if (room.roundTimeout) clearTimeout(room.roundTimeout);
  room.roundTimeout = null;
  broadcast(io, room);
}

function broadcast(io: BombNamespace, room: Room): void {
  room.players.forEach((player) => {
    if (player?.connected) io.to(player.socketId).emit("state_updated", statePayload(room, player.seat));
  });
  activeClassroomMonitor.notifyClassroomChanged(room.classroomCode);
}

function viewFor(room: Room, seat: PlayerSeat): BombGameViewState | null {
  const role = room.players[seat]?.role;
  if (!role) return null;
  const shared = {
    phase: room.phase,
    lives: room.lives,
    hintsEnabled: room.hintsEnabled,
    countdownEndsAt: room.countdownEndsAt,
    timerEndsAt: room.timerEndsAt,
    replayCountdownEndsAt: room.replayCountdownEndsAt,
    replayVotes: [...room.replayVotes],
    completedSections: room.level.completedSections,
    eventId: room.level.lastEventId,
    mistake: room.level.lastMistake,
    resultReason: room.resultReason,
  };
  if (role === "manual") return { ...shared, role, calculations: room.level.manualCalculations };
  return {
    ...shared,
    role,
    orderingNumbers: room.level.orderingNumbers,
    orderingProgress: room.level.orderingProgress,
    numericAnswers: room.level.numericAnswers,
    operatorAnswers: room.level.operatorAnswers,
    numericTargets: ["A + B", "B − C", "C + A"],
    operatorEquations: [
      { left: "5", right: "A", result: room.level.values.A + 5 },
      { left: "8", right: "C", result: 8 - room.level.values.C },
      { left: "D", right: "3", result: room.level.values.D - 3 },
    ],
  };
}

function getOpenClassroomRooms(classroomCode: ClassroomCode): OpenRoomSummary[] {
  return [...rooms.values()]
    .filter((room) => room.visibility === "classroom" && room.classroomCode === classroomCode && room.phase === "role_selection" && room.players[0]?.connected && !room.players[1])
    .map((room) => ({ code: room.code, hostName: room.players[0]?.name ?? "" }))
    .sort((left, right) => left.hostName.localeCompare(right.hostName));
}

function broadcastClassroomRooms(io: BombNamespace, classroomCode: ClassroomCode | null): void {
  if (!classroomCode) return;
  io.to(classroomChannel(classroomCode)).emit("classroom_rooms_updated", { classroomCode, openRooms: getOpenClassroomRooms(classroomCode) });
  activeClassroomMonitor.notifyClassroomChanged(classroomCode);
}

function roomPayload(room: Room, seat: PlayerSeat) { return { code: room.code, seat, players: playersFor(room), state: viewFor(room, seat) }; }
function statePayload(room: Room, seat: PlayerSeat) { return { code: room.code, players: playersFor(room), state: viewFor(room, seat) }; }
function playersFor(room: Room): RoomPlayerInfo[] { return room.players.filter((player): player is Player => Boolean(player)).map(({ seat, name, connected, preference, role, ready }) => ({ seat, name, connected, preference, role, ready })); }
function createPlayer(socketId: string, seat: PlayerSeat, name: string): Player { return { socketId, seat, name, connected: true, preference: "either", role: null, ready: false }; }
function normalizeName(value: string): string | null { const name = value.trim().slice(0, 20); return name.length >= 2 ? name : null; }
function normalizeClassroomCode(value: string): ClassroomCode | null { const code = value.trim().toUpperCase(); return /^[A-HJ-KM-NP-Z]{4}$/.test(code) ? code : null; }
function classroomChannel(code: ClassroomCode): string { return `classroom:${code}`; }
function authorizedRoom(socket: BombSocket, rawCode: string) { const room = rooms.get(rawCode.trim().toUpperCase()); const player = room?.players.find((item) => item?.socketId === socket.id); return room && player ? { room, player } : null; }
function findBySocket(socketId: string) { for (const room of rooms.values()) { const player = room.players.find((item) => item?.socketId === socketId); if (player) return { room, player }; } return null; }
function leaveExistingRoom(io: BombNamespace, socket: BombSocket): void { const found = findBySocket(socket.id); if (found) closeRoom(io, found.room, "A sala foi encerrada."); }
function closeRoom(io: BombNamespace, room: Room, message: string): void { if (!rooms.has(room.code)) return; [room.waitingTimeout, room.countdownTimeout, room.roundTimeout, room.replayTimeout, room.closeTimeout].forEach((timer) => { if (timer) clearTimeout(timer); }); io.to(room.code).emit("room_closed", { code: room.code, message }); rooms.delete(room.code); broadcastClassroomRooms(io, room.classroomCode); }
function emitError(socket: BombSocket, code: string, message: string): void { socket.emit("multiplayer_error", { code, message }); }
