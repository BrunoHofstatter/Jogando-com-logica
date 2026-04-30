import type { Namespace, Socket } from "socket.io";

import type {
  MultiplayerErrorCode,
  PlayerSeat,
  RoomPlayerInfo,
  SptttClientToServerEvents,
  SptttServerToClientEvents,
} from "../../../src/SPTTT/Logic/multiplayer/protocol.ts";
import type { SptttPlayer, SptttState } from "../../../src/SPTTT/Logic/v2/index.ts";
import {
  applyMultiplayerMove,
  createMultiplayerInitialState,
  resolveMultiplayerMove,
} from "../spttt/sptttAdapter.ts";
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

type SptttNamespace = Namespace<
  SptttClientToServerEvents,
  SptttServerToClientEvents
>;

type SptttSocket = Socket<
  SptttClientToServerEvents,
  SptttServerToClientEvents
>;

type SptttRoom = MultiplayerRoom<SptttState>;

const roomStore = createRoomStore<SptttRoom>();

export function registerSptttRoomHandlers(io: SptttNamespace): void {
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
      const room: SptttRoom = {
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
        mark: getPlayerMark(CREATOR_SEAT),
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
        emitError(socket, "room_not_found", "Sala nÃ£o encontrada.");
        return;
      }

      if (room.status !== "waiting") {
        emitError(socket, "room_not_joinable", "Essa sala jÃ¡ comeÃ§ou.");
        return;
      }

      if (room.players[JOINER_SEAT] !== null) {
        emitError(socket, "room_full", "Essa sala jÃ¡ estÃ¡ cheia.");
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
        mark: getPlayerMark(JOINER_SEAT),
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
        emitError(socket, "room_not_found", "Sala nÃ£o encontrada.");
        return;
      }

      const player = getPlayerBySocketId(room, socket.id);
      if (!player) {
        emitError(socket, "unauthorized", "VocÃª nÃ£o pertence a esta sala.");
        return;
      }

      const playerMark = getPlayerMark(player.seat);
      if (room.state.currentPlayer !== playerMark) {
        emitError(socket, "not_your_turn", "Ainda nÃ£o Ã© a sua vez.");
        return;
      }

      const resolvedIntent = resolveMultiplayerMove(room.state, intent, playerMark);
      if (!resolvedIntent) {
        emitError(socket, "illegal_move", "Movimento invÃ¡lido.");
        return;
      }

      const result = applyMultiplayerMove(room.state, resolvedIntent);
      if (!result.ok) {
        emitError(socket, "illegal_move", "Movimento invÃ¡lido.");
        return;
      }

      room.state = result.state;
      room.status = result.state.status === "ended" ? "ended" : "playing";
      room.updatedAt = Date.now();
      room.rematchVotes.clear();

      io.to(room.code).emit("state_updated", {
        code: room.code,
        state: room.state,
      });
    });

    socket.on("request_rematch", ({ code }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala nÃ£o encontrada.");
        return;
      }

      const player = getPlayerBySocketId(room, socket.id);
      if (!player) {
        emitError(socket, "unauthorized", "VocÃª nÃ£o pertence a esta sala.");
        return;
      }

      if (room.state.status !== "ended") {
        emitError(socket, "room_not_joinable", "A revanche sÃ³ pode comeÃ§ar ao final da partida.");
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
        requestedBy: player.seat as PlayerSeat,
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
  io: SptttNamespace,
  room: SptttRoom,
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
    closeRoomImmediately(io, room, player.seat as PlayerSeat, "O outro jogador saiu da sala.");
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
    seat: player.seat as PlayerSeat,
    reason: "disconnect",
    message: "O outro jogador desconectou. A sala serÃ¡ encerrada em instantes.",
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
      message: "A sala foi encerrada porque o outro jogador nÃ£o voltou.",
    });
    roomStore.deleteRoom(latestRoom.code);
  }, DISCONNECT_GRACE_MS);
}

function closeRoomImmediately(
  io: SptttNamespace,
  room: SptttRoom,
  leavingSeat: PlayerSeat,
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
  io: SptttNamespace,
  room: SptttRoom,
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
        message: "A sala expirou porque ninguÃ©m entrou a tempo.",
      });
    }

    roomStore.deleteRoom(latestRoom.code);
  }, WAITING_ROOM_TTL_MS);
}

function leaveAnyExistingRoom(
  io: SptttNamespace,
  socket: SptttSocket,
  reason: "leave_room",
): void {
  const currentRoom = roomStore.findRoomBySocketId(socket.id);
  if (!currentRoom) {
    return;
  }

  handlePlayerExit(io, currentRoom, socket.id, reason);
}

function getPlayerBySocketId(
  room: SptttRoom,
  socketId: string,
): RoomPlayer | null {
  return room.players.find((player) => player?.socketId === socketId) ?? null;
}

function serializePlayers(room: SptttRoom): RoomPlayerInfo[] {
  return room.players
    .filter((player): player is RoomPlayer => player !== null)
    .map((player) => ({
      seat: player.seat as PlayerSeat,
      mark: getPlayerMark(player.seat as PlayerSeat),
      name: player.name,
      connected: player.connected,
    }));
}

function getPlayerMark(seat: PlayerSeat): SptttPlayer {
  return seat === CREATOR_SEAT ? "X" : "O";
}

function normalizePlayerName(playerName: string): string | null {
  const normalizedName = playerName.trim().slice(0, 20);
  return normalizedName.length >= 2 ? normalizedName : null;
}

function emitError(
  socket: SptttSocket,
  code: MultiplayerErrorCode,
  message: string,
): void {
  socket.emit("multiplayer_error", { code, message });
}
