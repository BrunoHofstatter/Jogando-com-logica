import type { Namespace, Socket } from "socket.io";

import type {
  ClassroomCode,
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents,
  MultiplayerErrorCode,
  OpenRoomSummary,
  RoomPlayerInfo,
} from "../../../src/CrownChase/Logic/multiplayer/protocol.ts";
import type { CrownChaseState, PlayerId } from "../../../src/CrownChase/Logic/v2/index.ts";
import {
  applyMultiplayerMove,
  createMultiplayerInitialState,
  resolveMultiplayerMove,
} from "../crownChase/crownChaseAdapter.ts";
import { generateRoomCode } from "../rooms/roomCode.ts";
import { createRoomStore } from "../rooms/roomStore.ts";
import {
  CREATOR_SEAT,
  DISCONNECT_GRACE_MS,
  JOINER_SEAT,
  WAITING_ROOM_TTL_MS,
  type MultiplayerRoom,
  type RoomPlayer,
} from "../rooms/roomTypes.ts";
import type { ClassroomStore } from "../classrooms/classroomStore.ts";

type CrownChaseNamespace = Namespace<
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents
>;

type CrownChaseSocket = Socket<
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents
>;

type CrownChaseRoom = MultiplayerRoom<CrownChaseState> & {
  visibility: "private" | "classroom";
  classroomCode: ClassroomCode | null;
};

const roomStore = createRoomStore<CrownChaseRoom>();

export function registerRoomHandlers(
  io: CrownChaseNamespace,
  classroomStore: ClassroomStore,
): void {
  io.on("connection", (socket) => {
    socket.on("create_room", ({ playerName, classroomCode }) => {
      leaveAnyExistingRoom(io, socket, "leave_room");

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
      if (classroomCode && (!classroom || classroom.gameId !== "crown_chase")) {
        emitError(socket, "classroom_not_found", "Turma não encontrada.");
        return;
      }

      const roomCode = generateRoomCode(new Set(roomStore.getRooms().keys()));
      const hostPlayer: RoomPlayer = {
        socketId: socket.id,
        seat: CREATOR_SEAT,
        name: normalizedName,
        connected: true,
      };
      const room: CrownChaseRoom = {
        code: roomCode,
        state: createMultiplayerInitialState(),
        status: "waiting",
        players: [null, null],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        rematchVotes: new Set(),
        waitingTimeout: null,
        closeTimeout: null,
        visibility: normalizedClassroomCode ? "classroom" : "private",
        classroomCode: normalizedClassroomCode,
      };

      room.players[CREATOR_SEAT] = hostPlayer;
      scheduleWaitingRoomExpiry(io, room);
      roomStore.setRoom(room);

      socket.join(roomCode);
      socket.emit("room_created", {
        code: roomCode,
        seat: CREATOR_SEAT,
        state: room.state,
        players: serializePlayers(room),
      });
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("join_room", ({ code, playerName }) => {
      leaveAnyExistingRoom(io, socket, "leave_room");

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

      if (room.players[JOINER_SEAT] !== null) {
        emitError(socket, "room_full", "Essa sala já está cheia.");
        return;
      }

      if (room.waitingTimeout) {
        clearTimeout(room.waitingTimeout);
        room.waitingTimeout = null;
      }

      room.players[JOINER_SEAT] = {
        socketId: socket.id,
        seat: JOINER_SEAT,
        name: normalizedName,
        connected: true,
      };
      room.status = room.state.status === "ended" ? "ended" : "playing";
      room.updatedAt = Date.now();
      room.rematchVotes.clear();

      socket.join(room.code);
      socket.emit("room_joined", {
        code: room.code,
        seat: JOINER_SEAT,
        state: room.state,
        players: serializePlayers(room),
      });
      io.to(room.code).emit("room_ready", {
        code: room.code,
        state: room.state,
        players: serializePlayers(room),
      });
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("create_classroom", ({ gameId }) => {
      if (gameId !== "crown_chase" && gameId !== "spttt" && gameId !== "math_war") {
        emitError(socket, "unauthorized", "Esse jogo ainda não possui turmas online.");
        return;
      }

      socket.emit("classroom_created", {
        classroom: classroomStore.createClassroom(gameId),
      });
    });

    socket.on("list_managed_classrooms", ({ managementTokens }) => {
      socket.emit("managed_classrooms", {
        classrooms: classroomStore.getManagedClassrooms(managementTokens),
      });
    });

    socket.on("delete_classroom", ({ code, managementToken }) => {
      const normalizedCode = normalizeClassroomCode(code);
      const classroom = normalizedCode
        ? classroomStore.getClassroom(normalizedCode)
        : undefined;

      if (!classroom || classroom.managementToken !== managementToken) {
        emitError(socket, "unauthorized", "Não foi possível excluir essa turma.");
        return;
      }

      classroomStore.deleteClassroom(classroom.code);
      socket.emit("classroom_deleted", { code: classroom.code });
    });

    socket.on("join_classroom", ({ code }) => {
      const normalizedCode = normalizeClassroomCode(code);
      const classroom = normalizedCode ? classroomStore.getClassroom(normalizedCode) : undefined;
      if (!classroom || classroom.gameId !== "crown_chase") {
        emitError(socket, "classroom_not_found", "Turma não encontrada.");
        return;
      }

      socket.join(getClassroomChannel(normalizedCode));
      socket.emit("classroom_joined", {
        classroomCode: normalizedCode,
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
      if (!classroom || classroom.gameId !== "crown_chase") {
        emitError(socket, "classroom_not_found", "Turma não encontrada.");
        return;
      }

      socket.emit("classroom_rooms_updated", {
        classroomCode: normalizedCode,
        openRooms: getOpenClassroomRooms(normalizedCode),
      });
    });

    socket.on("submit_move", ({ code, intent }) => {
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

      if (room.state.currentPlayer !== player.seat) {
        emitError(socket, "not_your_turn", "Ainda não é a sua vez.");
        return;
      }

      const action = resolveMultiplayerMove(room.state, intent, player.seat);
      if (!action) {
        emitError(socket, "illegal_move", "Movimento inválido.");
        return;
      }

      const result = applyMultiplayerMove(room.state, action);
      if (!result.ok) {
        emitError(socket, "illegal_move", "Movimento inválido.");
        return;
      }

      room.state = result.state;
      room.status = result.state.status === "ended" ? "ended" : "playing";
      room.updatedAt = Date.now();
      room.rematchVotes.clear();

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

      if (room.state.status !== "ended") {
        emitError(socket, "room_not_joinable", "A revanche só pode começar ao final da partida.");
        return;
      }

      if (room.players.some((registeredPlayer) => registeredPlayer === null || !registeredPlayer.connected)) {
        emitError(socket, "room_not_joinable", "A sala precisa de dois jogadores para a revanche.");
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

      if (room.rematchVotes.size < 2) {
        return;
      }

      room.state = createMultiplayerInitialState();
      room.status = "playing";
      room.rematchVotes.clear();
      room.updatedAt = Date.now();

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
  io: CrownChaseNamespace,
  room: CrownChaseRoom,
  socketId: string,
  reason: "disconnect" | "leave_room",
): void {
  const player = getPlayerBySocketId(room, socketId);
  if (!player) {
    return;
  }

  if (room.waitingTimeout) {
    clearTimeout(room.waitingTimeout);
    room.waitingTimeout = null;
  }

  if (reason === "leave_room") {
    closeRoomImmediately(io, room, player.seat, "O outro jogador saiu da sala.");
    return;
  }

  player.connected = false;
  room.updatedAt = Date.now();

  const remainingPlayer = room.players.find(
    (registeredPlayer) => registeredPlayer !== null && registeredPlayer.socketId !== socketId,
  );

  if (!remainingPlayer) {
    roomStore.deleteRoom(room.code);
    broadcastClassroomRooms(io, room.classroomCode);
    return;
  }

  io.to(remainingPlayer.socketId).emit("opponent_left", {
    code: room.code,
    seat: player.seat,
    reason: "disconnect",
    message: "O outro jogador desconectou. A sala será encerrada em instantes.",
  });

  if (room.closeTimeout) {
    clearTimeout(room.closeTimeout);
  }

  room.closeTimeout = setTimeout(() => {
    const latestRoom = roomStore.getRoom(room.code);
    if (!latestRoom) {
      return;
    }

    io.to(remainingPlayer.socketId).emit("room_closed", {
      code: latestRoom.code,
      reason: "opponent_left",
      message: "A sala foi encerrada porque o outro jogador não voltou.",
    });
    roomStore.deleteRoom(latestRoom.code);
    broadcastClassroomRooms(io, latestRoom.classroomCode);
  }, DISCONNECT_GRACE_MS);
}

function closeRoomImmediately(
  io: CrownChaseNamespace,
  room: CrownChaseRoom,
  leavingSeat: PlayerId,
  message: string,
): void {
  const remainingPlayer = room.players.find(
    (player) => player !== null && player.seat !== leavingSeat,
  );

  if (remainingPlayer) {
    io.to(remainingPlayer.socketId).emit("opponent_left", {
      code: room.code,
      seat: leavingSeat,
      reason: "leave_room",
      message,
    });

    io.to(remainingPlayer.socketId).emit("room_closed", {
      code: room.code,
      reason: room.status === "waiting" ? "waiting_host_left" : "opponent_left",
      message,
    });
  }

  roomStore.deleteRoom(room.code);
  broadcastClassroomRooms(io, room.classroomCode);
}

function scheduleWaitingRoomExpiry(
  io: CrownChaseNamespace,
  room: CrownChaseRoom,
): void {
  if (room.waitingTimeout) {
    clearTimeout(room.waitingTimeout);
  }

  room.waitingTimeout = setTimeout(() => {
    const latestRoom = roomStore.getRoom(room.code);
    if (!latestRoom) {
      return;
    }

    const host = latestRoom.players[CREATOR_SEAT];
    if (host?.connected) {
      io.to(host.socketId).emit("room_closed", {
        code: latestRoom.code,
        reason: "room_expired",
        message: "A sala expirou porque ninguém entrou a tempo.",
      });
    }

    roomStore.deleteRoom(latestRoom.code);
    broadcastClassroomRooms(io, latestRoom.classroomCode);
  }, WAITING_ROOM_TTL_MS);
}

function leaveAnyExistingRoom(
  io: CrownChaseNamespace,
  socket: CrownChaseSocket,
  reason: "leave_room",
): void {
  const currentRoom = roomStore.findRoomBySocketId(socket.id);
  if (!currentRoom) {
    return;
  }

  handlePlayerExit(io, currentRoom, socket.id, reason);
}

function getPlayerBySocketId(
  room: CrownChaseRoom,
  socketId: string,
): RoomPlayer | null {
  return room.players.find((player) => player?.socketId === socketId) ?? null;
}

function serializePlayers(room: CrownChaseRoom): RoomPlayerInfo[] {
  return room.players
    .filter((player): player is RoomPlayer => player !== null)
    .map((player) => ({
      seat: player.seat,
      name: player.name,
      connected: player.connected,
    }));
}

function normalizePlayerName(playerName: string): string | null {
  const normalizedName = playerName.trim().slice(0, 20);
  return normalizedName.length >= 2 ? normalizedName : null;
}

function normalizeClassroomCode(code: string): ClassroomCode | null {
  const normalizedCode = code.trim().toUpperCase();
  return /^[A-HJ-KM-NP-Z]{4}$/.test(normalizedCode) ? normalizedCode : null;
}

function getClassroomChannel(classroomCode: ClassroomCode): string {
  return `classroom:${classroomCode}`;
}

function getOpenClassroomRooms(classroomCode: ClassroomCode): OpenRoomSummary[] {
  return [...roomStore.getRooms().values()]
    .filter((room) =>
      room.visibility === "classroom"
      && room.classroomCode === classroomCode
      && room.status === "waiting"
      && room.players[CREATOR_SEAT]?.connected,
    )
    .map((room) => ({
      code: room.code,
      hostName: room.players[CREATOR_SEAT]?.name ?? "",
    }))
    .sort((left, right) => left.hostName.localeCompare(right.hostName));
}

function broadcastClassroomRooms(
  io: CrownChaseNamespace,
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

function emitError(
  socket: CrownChaseSocket,
  code: MultiplayerErrorCode,
  message: string,
): void {
  socket.emit("multiplayer_error", { code, message });
}
