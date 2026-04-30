import type { Namespace, Socket } from "socket.io";

import type {
  MathWarClientToServerEvents,
  MathWarServerToClientEvents,
  MultiplayerErrorCode,
  RoomPlayerInfo,
} from "../../../src/MathWar/Logic/multiplayer/protocol.ts";
import type { MathWarState, PlayerId } from "../../../src/MathWar/Logic/v2/index.ts";
import {
  applyMultiplayerMove,
  createMultiplayerInitialState,
  resolveMultiplayerMove,
} from "../mathWar/mathWarAdapter.ts";
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

type MathWarNamespace = Namespace<
  MathWarClientToServerEvents,
  MathWarServerToClientEvents
>;

type MathWarSocket = Socket<
  MathWarClientToServerEvents,
  MathWarServerToClientEvents
>;

type MathWarRoom = MultiplayerRoom<MathWarState>;

const roomStore = createRoomStore<MathWarRoom>();

export function registerMathWarRoomHandlers(io: MathWarNamespace): void {
  io.on("connection", (socket) => {
    socket.on("create_room", ({ playerName }) => {
      leaveAnyExistingRoom(io, socket, "leave_room");

      const normalizedName = normalizePlayerName(playerName);
      if (!normalizedName) {
        emitError(socket, "invalid_name", "Digite um nome com pelo menos 2 letras.");
        return;
      }

      const roomCode = generateRoomCode(new Set(roomStore.getRooms().keys()));
      const hostPlayer: RoomPlayer = {
        socketId: socket.id,
        seat: CREATOR_SEAT,
        name: normalizedName,
        connected: true,
      };
      const room: MathWarRoom = {
        code: roomCode,
        state: createMultiplayerInitialState(),
        status: "waiting",
        players: [null, null],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        rematchVotes: new Set(),
        waitingTimeout: null,
        closeTimeout: null,
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
  io: MathWarNamespace,
  room: MathWarRoom,
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
  }, DISCONNECT_GRACE_MS);
}

function closeRoomImmediately(
  io: MathWarNamespace,
  room: MathWarRoom,
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
}

function scheduleWaitingRoomExpiry(
  io: MathWarNamespace,
  room: MathWarRoom,
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
  }, WAITING_ROOM_TTL_MS);
}

function leaveAnyExistingRoom(
  io: MathWarNamespace,
  socket: MathWarSocket,
  reason: "leave_room",
): void {
  const currentRoom = roomStore.findRoomBySocketId(socket.id);
  if (!currentRoom) {
    return;
  }

  handlePlayerExit(io, currentRoom, socket.id, reason);
}

function getPlayerBySocketId(
  room: MathWarRoom,
  socketId: string,
): RoomPlayer | null {
  return room.players.find((player) => player?.socketId === socketId) ?? null;
}

function serializePlayers(room: MathWarRoom): RoomPlayerInfo[] {
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

function emitError(
  socket: MathWarSocket,
  code: MultiplayerErrorCode,
  message: string,
): void {
  socket.emit("multiplayer_error", { code, message });
}
