import type { Namespace, Socket } from "socket.io";

import type {
  CacaSomaClientToServerEvents,
  CacaSomaOpenRoomSummary,
  CacaSomaRoomSeat,
  CacaSomaRoomSettings,
  CacaSomaServerToClientEvents,
  ClassroomCode,
  MultiplayerErrorCode,
  RoomPlayerInfo,
} from "../../../src/Caca_soma/Logic/multiplayer/protocol.ts";
import {
  advanceMultiplayerRoundPhase,
  applyMultiplayerAction,
  createMultiplayerInitialState,
  expireMultiplayerRound,
  resolveMultiplayerAction,
} from "../cacaSoma/cacaSomaAdapter.ts";
import {
  CACA_SOMA_DISCONNECT_GRACE_MS,
  CACA_SOMA_MAX_ROOM_CAPACITY,
  CACA_SOMA_WAITING_ROOM_TTL_MS,
  getRoomCapacity,
  getSeatInfo,
  type CacaSomaRoom,
  type CacaSomaRoomPlayer,
} from "../cacaSoma/cacaSomaRoomTypes.ts";
import { generateRoomCode } from "../rooms/roomCode.ts";
import { createRoomStore } from "../rooms/roomStore.ts";
import type { ClassroomStore } from "../classrooms/classroomStore.ts";

type CacaSomaNamespace = Namespace<
  CacaSomaClientToServerEvents,
  CacaSomaServerToClientEvents
>;

type CacaSomaSocket = Socket<
  CacaSomaClientToServerEvents,
  CacaSomaServerToClientEvents
>;

const roomStore = createRoomStore<CacaSomaRoom>();

const DEFAULT_ROOM_SETTINGS: CacaSomaRoomSettings = {
  mode: "2v2",
  difficultyId: "medium",
  targetScore: 3,
};

export function registerCacaSomaRoomHandlers(
  io: CacaSomaNamespace,
  classroomStore: ClassroomStore,
): void {
  io.on("connection", (socket) => {
    socket.on("create_room", ({ playerName, classroomCode }) => {
      leaveAnyExistingRoom(io, socket);

      const normalizedName = normalizePlayerName(playerName);
      if (!normalizedName) {
        emitError(socket, "invalid_name", "Digite um nome com pelo menos 2 letras.");
        return;
      }

      const normalizedClassroomCode = classroomCode
        ? normalizeClassroomCode(classroomCode)
        : null;
      const classroom = normalizedClassroomCode
        ? classroomStore.getClassroom(normalizedClassroomCode)
        : undefined;
      if (classroomCode && !classroom) {
        emitError(socket, "classroom_not_found", "Turma não encontrada.");
        return;
      }

      const roomCode = generateRoomCode(new Set(roomStore.getRooms().keys()));
      const now = Date.now();
      const room: CacaSomaRoom = {
        code: roomCode,
        visibility: normalizedClassroomCode ? "classroom" : "private",
        classroomCode: normalizedClassroomCode,
        settings: DEFAULT_ROOM_SETTINGS,
        state: null,
        status: "waiting",
        players: [createPlayer(socket.id, normalizedName, 0, true, DEFAULT_ROOM_SETTINGS), null, null, null],
        createdAt: now,
        updatedAt: now,
        rematchVotes: new Set(),
        waitingTimeout: null,
        closeTimeout: null,
        roundTimeout: null,
      };

      scheduleWaitingRoomExpiry(io, room);
      roomStore.setRoom(room);

      socket.join(roomCode);
      socket.emit("room_created", {
        code: roomCode,
        seat: 0,
        settings: room.settings,
        state: room.state,
        players: serializePlayers(room),
      });
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("join_room", ({ code, playerName }) => {
      leaveAnyExistingRoom(io, socket);

      const normalizedCode = code.trim().toUpperCase();
      const normalizedName = normalizePlayerName(playerName);

      if (!normalizedName) {
        emitError(socket, "invalid_name", "Digite um nome com pelo menos 2 letras.");
        return;
      }

      const room = roomStore.getRoom(normalizedCode);
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      if (room.status !== "waiting") {
        emitError(socket, "room_not_joinable", "Essa sala já começou.");
        return;
      }

      const availableSeat = getAvailableSeat(room);
      if (availableSeat === null) {
        emitError(socket, "room_full", "Essa sala já está cheia.");
        return;
      }

      room.players[availableSeat] = createPlayer(socket.id, normalizedName, availableSeat, false, room.settings);
      room.updatedAt = Date.now();
      room.rematchVotes.clear();

      socket.join(room.code);
      socket.emit("room_joined", {
        code: room.code,
        seat: availableSeat,
        settings: room.settings,
        state: room.state,
        players: serializePlayers(room),
      });

      emitRoomUpdated(io, room);
      scheduleWaitingRoomExpiry(io, room);
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("update_room_settings", ({ code, settingsPatch }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const player = getPlayerBySocketId(room, socket.id);
      if (!player) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
        return;
      }

      if (!player.isHost) {
        emitError(socket, "host_only", "Só o anfitrião pode mudar as opções.");
        return;
      }

      if (room.status !== "waiting") {
        emitError(socket, "room_not_joinable", "A partida já começou.");
        return;
      }

      const nextSettings = {
        ...room.settings,
        ...settingsPatch,
      };

      if (!isValidSettings(nextSettings)) {
        emitError(socket, "invalid_settings", "As configurações da sala são inválidas.");
        return;
      }

      if (!canApplySettingsToCurrentPlayers(room, nextSettings)) {
        emitError(socket, "invalid_settings", "Essa modalidade não cabe nos jogadores atuais da sala.");
        return;
      }

      room.settings = nextSettings;
      syncPlayerSeatInfo(room);
      room.updatedAt = Date.now();
      room.rematchVotes.clear();
      emitRoomUpdated(io, room);
      scheduleWaitingRoomExpiry(io, room);
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("start_match", ({ code }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const player = getPlayerBySocketId(room, socket.id);
      if (!player) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
        return;
      }

      if (!player.isHost) {
        emitError(socket, "host_only", "Só o anfitrião pode começar a partida.");
        return;
      }

      if (room.status !== "waiting") {
        emitError(socket, "room_not_joinable", "A partida já começou.");
        return;
      }

      const roomCapacity = getRoomCapacity(room.settings);
      if (!isRoomFull(room) || getActiveRegisteredPlayers(room).some((registeredPlayer) => !registeredPlayer.connected)) {
        emitError(socket, "not_enough_players", `A sala precisa de ${roomCapacity} jogadores conectados.`);
        return;
      }

      if (room.waitingTimeout) {
        clearTimeout(room.waitingTimeout);
        room.waitingTimeout = null;
      }

      room.state = createMultiplayerInitialState(room.settings, Date.now());
      room.status = room.state.status === "ended" ? "ended" : "playing";
      room.updatedAt = Date.now();
      room.rematchVotes.clear();

      syncRoundTimeout(io, room);

      io.to(room.code).emit("room_ready", {
        code: room.code,
        settings: room.settings,
        state: room.state,
        players: serializePlayers(room),
      });
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("join_classroom", ({ code }) => {
      const normalizedCode = normalizeClassroomCode(code);
      const classroom = normalizedCode ? classroomStore.getClassroom(normalizedCode) : undefined;
      if (!normalizedCode || !classroom) {
        emitError(socket, "classroom_not_found", "Turma não encontrada.");
        return;
      }

      socket.join(getClassroomChannel(normalizedCode));
      socket.emit("classroom_joined", {
        classroomCode: normalizedCode,
        expiresAt: classroom.expiresAt,
        openRooms: getOpenClassroomRooms(normalizedCode),
      });
    });

    socket.on("leave_classroom", ({ code }) => {
      const normalizedCode = normalizeClassroomCode(code);
      if (normalizedCode) {
        socket.leave(getClassroomChannel(normalizedCode));
      }
    });

    socket.on("list_open_rooms", ({ classroomCode }) => {
      const normalizedCode = normalizeClassroomCode(classroomCode);
      const classroom = normalizedCode ? classroomStore.getClassroom(normalizedCode) : undefined;
      if (!normalizedCode || !classroom) {
        emitError(socket, "classroom_not_found", "Turma não encontrada.");
        return;
      }

      socket.emit("classroom_rooms_updated", {
        classroomCode: normalizedCode,
        openRooms: getOpenClassroomRooms(normalizedCode),
      });
    });

    socket.on("submit_action", ({ code, intent }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const player = getPlayerBySocketId(room, socket.id);
      if (!player) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
        return;
      }

      if (!room.state || room.status !== "playing") {
        emitError(socket, "room_not_joinable", "A partida ainda não está pronta.");
        return;
      }

      const resolvedAction = resolveMultiplayerAction(room.settings, player.seat, intent, Date.now());
      const result = applyMultiplayerAction(room.state, resolvedAction);
      if (!result.ok) {
        emitActionError(socket, result.reason, result.remainingCooldownMs);
        return;
      }

      if (result.events.length === 0 && result.state === room.state) {
        return;
      }

      room.state = result.state;
      room.status = result.state.status === "ended" ? "ended" : "playing";
      room.updatedAt = Date.now();
      room.rematchVotes.clear();

      syncRoundTimeout(io, room);

      io.to(room.code).emit("state_updated", {
        code: room.code,
        state: room.state,
        events: result.events,
      });
    });

    socket.on("request_rematch", ({ code }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const player = getPlayerBySocketId(room, socket.id);
      if (!player) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
        return;
      }

      if (!room.state || room.state.status !== "ended") {
        emitError(socket, "room_not_joinable", "A revanche só pode começar ao final da partida.");
        return;
      }

      const roomCapacity = getRoomCapacity(room.settings);
      if (!isRoomFull(room) || getActiveRegisteredPlayers(room).some((registeredPlayer) => !registeredPlayer.connected)) {
        emitError(socket, "room_not_joinable", `A sala precisa de ${roomCapacity} jogadores conectados para a revanche.`);
        return;
      }

      if (room.rematchVotes.has(player.seat)) {
        return;
      }

      room.rematchVotes.add(player.seat);
      room.updatedAt = Date.now();
      io.to(room.code).emit("rematch_requested", {
        code: room.code,
        requestedBy: player.seat,
      });

      if (room.rematchVotes.size < roomCapacity) {
        return;
      }

      room.state = createMultiplayerInitialState(room.settings, Date.now());
      room.status = room.state.status === "ended" ? "ended" : "playing";
      room.rematchVotes.clear();
      room.updatedAt = Date.now();

      syncRoundTimeout(io, room);

      io.to(room.code).emit("rematch_started", {
        code: room.code,
        state: room.state,
      });
    });

    socket.on("leave_room", ({ code }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        return;
      }

      handlePlayerExit(io, room, socket.id, "leave_room");
    });

    socket.on("disconnect", () => {
      const room = roomStore.findRoomBySocketId(socket.id);
      if (!room) {
        return;
      }

      handlePlayerExit(io, room, socket.id, "disconnect");
    });
  });
}

function handlePlayerExit(
  io: CacaSomaNamespace,
  room: CacaSomaRoom,
  socketId: string,
  reason: "disconnect" | "leave_room",
): void {
  const player = getPlayerBySocketId(room, socketId);
  if (!player) {
    return;
  }

  clearRoomTimers(room);

  if (room.status === "waiting") {
    if (player.isHost) {
      closeRoomImmediately(
        io,
        room,
        player.seat,
        reason === "disconnect"
          ? "A sala foi encerrada porque o anfitrião desconectou."
          : "A sala foi encerrada porque o anfitrião saiu.",
      );
      return;
    }

    room.players[player.seat] = null;
    room.updatedAt = Date.now();
    room.rematchVotes.clear();

    if (room.players.every((registeredPlayer) => registeredPlayer === null)) {
      roomStore.deleteRoom(room.code);
      return;
    }

    emitRoomUpdated(io, room);
    scheduleWaitingRoomExpiry(io, room);
    broadcastClassroomRooms(io, room.classroomCode);
    return;
  }

  if (reason === "leave_room") {
    closeRoomImmediately(io, room, player.seat, "Um jogador saiu da sala.");
    return;
  }

  player.connected = false;
  room.updatedAt = Date.now();

  const remainingPlayers = room.players.filter(
    (registeredPlayer): registeredPlayer is CacaSomaRoomPlayer =>
      registeredPlayer !== null && registeredPlayer.socketId !== socketId && registeredPlayer.connected,
  );

  if (remainingPlayers.length === 0) {
    roomStore.deleteRoom(room.code);
    return;
  }

  io.to(room.code).emit("player_left", {
    code: room.code,
    seat: player.seat,
    reason: "disconnect",
    message: `${player.name} desconectou. A sala será encerrada em instantes.`,
  });

  room.closeTimeout = setTimeout(() => {
    const latestRoom = roomStore.getRoom(room.code);
    if (!latestRoom) {
      return;
    }

    io.to(latestRoom.code).emit("room_closed", {
      code: latestRoom.code,
      reason: "player_left",
      message: "A sala foi encerrada porque um jogador não voltou.",
    });
    roomStore.deleteRoom(latestRoom.code);
  }, CACA_SOMA_DISCONNECT_GRACE_MS);
}

function closeRoomImmediately(
  io: CacaSomaNamespace,
  room: CacaSomaRoom,
  leavingSeat: CacaSomaRoomSeat,
  message: string,
): void {
  io.to(room.code).emit("player_left", {
    code: room.code,
    seat: leavingSeat,
    reason: "leave_room",
    message,
  });

  io.to(room.code).emit("room_closed", {
    code: room.code,
    reason: "player_left",
    message,
  });

  roomStore.deleteRoom(room.code);
  broadcastClassroomRooms(io, room.classroomCode);
}

function scheduleWaitingRoomExpiry(
  io: CacaSomaNamespace,
  room: CacaSomaRoom,
): void {
  if (room.waitingTimeout) {
    clearTimeout(room.waitingTimeout);
  }

  if (room.status !== "waiting") {
    room.waitingTimeout = null;
    return;
  }

  room.waitingTimeout = setTimeout(() => {
    const latestRoom = roomStore.getRoom(room.code);
    if (!latestRoom || latestRoom.status !== "waiting") {
      return;
    }

    io.to(latestRoom.code).emit("room_closed", {
      code: latestRoom.code,
      reason: "room_expired",
      message: "A sala expirou porque a partida não começou a tempo.",
    });
    roomStore.deleteRoom(latestRoom.code);
    broadcastClassroomRooms(io, latestRoom.classroomCode);
  }, CACA_SOMA_WAITING_ROOM_TTL_MS);
}

function syncRoundTimeout(
  io: CacaSomaNamespace,
  room: CacaSomaRoom,
): void {
  if (room.roundTimeout) {
    clearTimeout(room.roundTimeout);
    room.roundTimeout = null;
  }

  if (!room.state || room.status !== "playing" || room.state.currentRound === null) {
    return;
  }

  const nextWakeAtMs = room.state.currentRound.phase === "playing"
    ? room.state.currentRound.deadlineAtMs
    : room.state.currentRound.phaseEndsAtMs;
  const delayMs = Math.max(0, nextWakeAtMs - Date.now());
  room.roundTimeout = setTimeout(() => {
    const latestRoom = roomStore.getRoom(room.code);
    if (!latestRoom || !latestRoom.state) {
      return;
    }

    const phaseResult = advanceMultiplayerRoundPhase(latestRoom.state, Date.now());
    if (phaseResult.changed) {
      latestRoom.state = phaseResult.state;
      latestRoom.status = phaseResult.state.status === "ended" ? "ended" : "playing";
      latestRoom.updatedAt = Date.now();

      syncRoundTimeout(io, latestRoom);

      io.to(latestRoom.code).emit("state_updated", {
        code: latestRoom.code,
        state: latestRoom.state,
        events: phaseResult.events,
      });
      return;
    }

    const result = expireMultiplayerRound(latestRoom.state, Date.now());
    if (!result.changed) {
      syncRoundTimeout(io, latestRoom);
      return;
    }

    latestRoom.state = result.state;
    latestRoom.status = result.state.status === "ended" ? "ended" : "playing";
    latestRoom.updatedAt = Date.now();

    syncRoundTimeout(io, latestRoom);

    io.to(latestRoom.code).emit("state_updated", {
      code: latestRoom.code,
      state: latestRoom.state,
      events: result.events,
    });
  }, delayMs);
}

function clearRoomTimers(room: CacaSomaRoom): void {
  if (room.waitingTimeout) {
    clearTimeout(room.waitingTimeout);
    room.waitingTimeout = null;
  }

  if (room.closeTimeout) {
    clearTimeout(room.closeTimeout);
    room.closeTimeout = null;
  }

  if (room.roundTimeout) {
    clearTimeout(room.roundTimeout);
    room.roundTimeout = null;
  }
}

function leaveAnyExistingRoom(
  io: CacaSomaNamespace,
  socket: CacaSomaSocket,
): void {
  const currentRoom = roomStore.findRoomBySocketId(socket.id);
  if (!currentRoom) {
    return;
  }

  handlePlayerExit(io, currentRoom, socket.id, "leave_room");
}

function emitRoomUpdated(io: CacaSomaNamespace, room: CacaSomaRoom): void {
  io.to(room.code).emit("room_updated", {
    code: room.code,
    settings: room.settings,
    state: room.state,
    players: serializePlayers(room),
  });
}

function normalizeClassroomCode(code: string): ClassroomCode | null {
  const normalizedCode = code.trim().toUpperCase();
  return /^[A-HJ-KM-NP-Z]{4}$/.test(normalizedCode) ? normalizedCode : null;
}

function getClassroomChannel(classroomCode: ClassroomCode): string {
  return `classroom:${classroomCode}`;
}

function getOpenClassroomRooms(classroomCode: ClassroomCode): CacaSomaOpenRoomSummary[] {
  return [...roomStore.getRooms().values()]
    .filter((room) =>
      room.visibility === "classroom"
      && room.classroomCode === classroomCode
      && room.status === "waiting"
      && room.players[0]?.connected
      && getAvailableSeat(room) !== null,
    )
    .map((room) => ({
      code: room.code,
      hostName: room.players[0]?.name ?? "",
      mode: room.settings.mode,
      playerCount: getActiveRegisteredPlayers(room).length,
      capacity: getRoomCapacity(room.settings),
      difficultyId: room.settings.difficultyId,
      targetScore: room.settings.targetScore,
    }))
    .sort((left, right) => left.hostName.localeCompare(right.hostName));
}

function broadcastClassroomRooms(
  io: CacaSomaNamespace,
  classroomCode: ClassroomCode | null,
): void {
  if (!classroomCode) {
    return;
  }

  io.to(getClassroomChannel(classroomCode)).emit("classroom_rooms_updated", {
    classroomCode,
    openRooms: getOpenClassroomRooms(classroomCode),
  });
}

function getPlayerBySocketId(
  room: CacaSomaRoom,
  socketId: string,
): CacaSomaRoomPlayer | null {
  return room.players.find((player) => player?.socketId === socketId) ?? null;
}

function createPlayer(
  socketId: string,
  name: string,
  seat: CacaSomaRoomSeat,
  isHost: boolean,
  settings: CacaSomaRoomSettings,
): CacaSomaRoomPlayer {
  const { team, playerIndex } = getSeatInfo(settings, seat);

  return {
    socketId,
    seat,
    team,
    playerIndex,
    name,
    connected: true,
    isHost,
  };
}

function serializePlayers(room: CacaSomaRoom): RoomPlayerInfo[] {
  return getActivePlayers(room)
    .filter((player): player is CacaSomaRoomPlayer => player !== null)
    .map((player) => ({
      seat: player.seat,
      team: player.team,
      playerIndex: player.playerIndex,
      name: player.name,
      connected: player.connected,
      isHost: player.isHost,
    }));
}

function getAvailableSeat(room: CacaSomaRoom): CacaSomaRoomSeat | null {
  for (let seat = 0; seat < getRoomCapacity(room.settings); seat += 1) {
    if (room.players[seat as CacaSomaRoomSeat] === null) {
      return seat as CacaSomaRoomSeat;
    }
  }

  return null;
}

function isRoomFull(room: CacaSomaRoom): boolean {
  return getActivePlayers(room).every((player) => player !== null);
}

function isValidSettings(settings: CacaSomaRoomSettings): boolean {
  return (
    typeof settings === "object" &&
    settings !== null &&
    (settings.mode === "1v1" || settings.mode === "2v2") &&
    (settings.difficultyId === "easy" ||
      settings.difficultyId === "medium" ||
      settings.difficultyId === "hard") &&
    [2, 3, 4, 5].includes(settings.targetScore)
  );
}

function getActivePlayers(room: CacaSomaRoom): Array<CacaSomaRoomPlayer | null> {
  return room.players.slice(0, getRoomCapacity(room.settings));
}

function getActiveRegisteredPlayers(room: CacaSomaRoom): CacaSomaRoomPlayer[] {
  return getActivePlayers(room).filter(
    (player): player is CacaSomaRoomPlayer => player !== null,
  );
}

function canApplySettingsToCurrentPlayers(
  room: CacaSomaRoom,
  settings: CacaSomaRoomSettings,
): boolean {
  const nextCapacity = getRoomCapacity(settings);
  return room.players
    .slice(nextCapacity, CACA_SOMA_MAX_ROOM_CAPACITY)
    .every((player) => player === null);
}

function syncPlayerSeatInfo(room: CacaSomaRoom): void {
  room.players.forEach((player) => {
    if (!player) {
      return;
    }

    const seatInfo = getSeatInfo(room.settings, player.seat);
    player.team = seatInfo.team;
    player.playerIndex = seatInfo.playerIndex;
  });
}

function normalizePlayerName(playerName: string): string | null {
  const normalizedName = playerName.trim().slice(0, 20);
  return normalizedName.length >= 2 ? normalizedName : null;
}

function emitError(
  socket: CacaSomaSocket,
  code: MultiplayerErrorCode,
  message: string,
): void {
  socket.emit("multiplayer_error", { code, message });
}

function emitActionError(
  socket: CacaSomaSocket,
  reason: string,
  remainingCooldownMs?: number,
): void {
  if (reason === "round_expired") {
    emitError(socket, "round_expired", "Essa rodada já terminou.");
    return;
  }

  if (reason === "round_not_playing") {
    emitError(socket, "round_expired", "Aguarde a rodada comecar.");
    return;
  }

  if (reason === "cooldown_active") {
    const waitMs = typeof remainingCooldownMs === "number"
      ? Math.ceil(remainingCooldownMs / 100) * 100
      : 0;
    emitError(
      socket,
      "cooldown_active",
      waitMs > 0
        ? `Espere ${Math.ceil(waitMs / 1000)} segundo${waitMs >= 2000 ? "s" : ""} antes de trocar de número de novo.`
        : "Espere um pouco antes de trocar de número de novo.",
    );
    return;
  }

  emitError(socket, "illegal_move", "Ação inválida.");
}
