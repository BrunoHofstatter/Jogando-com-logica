import { randomUUID } from "node:crypto";

import type { Namespace, Socket } from "socket.io";

import {
  normalizeStopAnswerSnapshot,
  type StopMultiplayerLogicErrorCode,
} from "../../../src/Stop/Logic/multiplayer/matchLogic.ts";
import type {
  MultiplayerErrorCode,
  StopClientToServerEvents,
  StopServerToClientEvents,
} from "../../../src/Stop/Logic/multiplayer/protocol.ts";
import {
  addStopRoomPlayer,
  addStopRoomRematchVote,
  advanceStopRoomRound,
  archiveStopRoomCurrentRound,
  createStopRoomInitialState,
  moveStopRoomToPlaying,
  moveStopRoomToResults,
  removeStopRoomPlayer,
  restartStopRoomMatch,
  resolveStopRoomRoundLock,
  startStopRoomMatch,
  updateStopRoomSettings,
} from "../stop/stopAdapter.ts";
import { createStopRoomStore } from "../stop/stopRoomStore.ts";
import type {
  StopMultiplayerRoom,
  StopRoomParticipant,
} from "../stop/stopRoomTypes.ts";
import { generateRoomCode } from "../rooms/roomCode.ts";
import { WAITING_ROOM_TTL_MS } from "../rooms/roomTypes.ts";

type StopNamespace = Namespace<
  StopClientToServerEvents,
  StopServerToClientEvents
>;

type StopSocket = Socket<
  StopClientToServerEvents,
  StopServerToClientEvents
>;

const roomStore = createStopRoomStore();

export function registerStopRoomHandlers(io: StopNamespace): void {
  io.on("connection", (socket) => {
    socket.on("create_room", ({ playerName }) => {
      leaveAnyExistingRoom(io, socket);

      const normalizedName = normalizePlayerName(playerName);
      if (!normalizedName) {
        emitError(socket, "invalid_name", "Digite um nome com pelo menos 2 letras.");
        return;
      }

      const roomCode = generateRoomCode(new Set(roomStore.getRooms().keys()));
      const playerId = randomUUID();
      const now = Date.now();
      const state = createStopRoomInitialState(playerId, normalizedName, now);
      const room: StopMultiplayerRoom = {
        code: roomCode,
        state,
        participants: [
          {
            playerId,
            socketId: socket.id,
          },
        ],
        answerSnapshotsByPlayerId: {},
        createdAt: now,
        updatedAt: now,
        waitingTimeout: null,
        roundPhaseTimeout: null,
      };

      scheduleLobbyExpiry(io, room);
      roomStore.setRoom(room);

      socket.join(roomCode);
      socket.emit("room_created", {
        code: roomCode,
        playerId,
        state: room.state,
      });
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

      if (room.state.status !== "lobby") {
        emitError(socket, "room_not_joinable", "Essa sala já começou.");
        return;
      }

      const playerId = randomUUID();
      const result = addStopRoomPlayer(room.state, playerId, normalizedName, Date.now());
      if (!result.ok) {
        emitError(socket, result.code, getErrorMessage(result.code));
        return;
      }

      room.state = result.state;
      room.participants.push({
        playerId,
        socketId: socket.id,
      });
      room.updatedAt = Date.now();
      scheduleLobbyExpiry(io, room);

      socket.join(room.code);
      socket.emit("room_joined", {
        code: room.code,
        playerId,
        state: room.state,
      });
      emitStateUpdated(io, room);
    });

    socket.on("update_room_settings", ({ code, settingsPatch }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const participant = getParticipantBySocketId(room, socket.id);
      if (!participant) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
        return;
      }

      const result = updateStopRoomSettings(
        room.state,
        participant.playerId,
        settingsPatch,
        Date.now(),
      );
      if (!result.ok) {
        emitError(socket, result.code, getErrorMessage(result.code));
        return;
      }

      room.state = result.state;
      room.updatedAt = Date.now();
      scheduleLobbyExpiry(io, room);
      emitStateUpdated(io, room);
    });

    socket.on("start_match", ({ code }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const participant = getParticipantBySocketId(room, socket.id);
      if (!participant) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
        return;
      }

      const result = startStopRoomMatch(
        room.state,
        participant.playerId,
        Date.now(),
      );
      if (!result.ok) {
        emitError(socket, result.code, getErrorMessage(result.code));
        return;
      }

      room.state = result.state;
      room.updatedAt = Date.now();
      room.answerSnapshotsByPlayerId = createEmptyAnswerSnapshots(room);

      if (room.waitingTimeout) {
        clearTimeout(room.waitingTimeout);
        room.waitingTimeout = null;
      }

      emitStateUpdated(io, room);
      scheduleRoundPhase(io, room);
    });

    socket.on("submit_answer_snapshot", ({ code, answers }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        return;
      }

      const participant = getParticipantBySocketId(room, socket.id);
      if (!participant) {
        return;
      }

      if (room.state.status !== "playing" || room.state.currentRound?.phase !== "playing") {
        return;
      }

      room.answerSnapshotsByPlayerId[participant.playerId] = normalizeStopAnswerSnapshot(
        answers,
        room.state.currentRound.round.boxes.length,
      );
    });

    socket.on("press_stop", ({ code, answers }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const participant = getParticipantBySocketId(room, socket.id);
      if (!participant) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
        return;
      }

      if (room.state.status !== "playing" || room.state.currentRound?.phase !== "playing") {
        emitError(socket, "round_not_active", "Essa rodada já foi encerrada.");
        return;
      }

      const normalizedAnswers = normalizeStopAnswerSnapshot(
        answers,
        room.state.currentRound.round.boxes.length,
      );

      room.answerSnapshotsByPlayerId[participant.playerId] = normalizedAnswers;

      if (!areAllAnswersFilled(normalizedAnswers)) {
        emitError(socket, "answers_incomplete", "Preencha todas as caixas antes de apertar STOP.");
        return;
      }

      lockActiveRound(io, room, participant.playerId, Date.now());
    });

    socket.on("request_rematch", ({ code }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala nÃ£o encontrada.");
        return;
      }

      const participant = getParticipantBySocketId(room, socket.id);
      if (!participant) {
        emitError(socket, "unauthorized", "VocÃª nÃ£o pertence a esta sala.");
        return;
      }

      const voteResult = addStopRoomRematchVote(
        room.state,
        participant.playerId,
        Date.now(),
      );
      if (!voteResult.ok) {
        emitError(socket, voteResult.code, getErrorMessage(voteResult.code));
        return;
      }

      room.state = voteResult.state;
      room.updatedAt = Date.now();
      emitStateUpdated(io, room);

      if (room.state.rematchPlayerIds.length < room.state.players.length) {
        return;
      }

      room.state = restartStopRoomMatch(room.state, Date.now());
      room.updatedAt = Date.now();
      room.answerSnapshotsByPlayerId = createEmptyAnswerSnapshots(room);
      emitStateUpdated(io, room);
      scheduleRoundPhase(io, room);
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
  io: StopNamespace,
  room: StopMultiplayerRoom,
  socketId: string,
  reason: "leave_room" | "disconnect",
): void {
  const participant = getParticipantBySocketId(room, socketId);
  if (!participant) {
    return;
  }

  const leavingPlayer = room.state.players.find(
    (player) => player.id === participant.playerId,
  );
  if (!leavingPlayer) {
    room.participants = room.participants.filter(
      (currentParticipant) => currentParticipant.socketId !== socketId,
    );
    return;
  }

  if (room.state.status !== "lobby" || leavingPlayer.isHost) {
    closeRoom(io, room, leavingPlayer, reason);
    return;
  }

  room.participants = room.participants.filter(
    (currentParticipant) => currentParticipant.playerId !== participant.playerId,
  );
  delete room.answerSnapshotsByPlayerId[participant.playerId];

  const result = removeStopRoomPlayer(room.state, participant.playerId, Date.now());
  if (!result.ok) {
    roomStore.deleteRoom(room.code);
    return;
  }

  room.state = result.state;
  room.updatedAt = Date.now();

  if (room.state.players.length === 0) {
    roomStore.deleteRoom(room.code);
    return;
  }

  scheduleLobbyExpiry(io, room);
  emitStateUpdated(io, room);
}

function closeRoom(
  io: StopNamespace,
  room: StopMultiplayerRoom,
  leavingPlayer: { isHost: boolean },
  reason: "leave_room" | "disconnect",
): void {
  const closeReason = leavingPlayer.isHost ? "host_left" : "player_left";
  const message = leavingPlayer.isHost
    ? reason === "disconnect"
      ? "A sala foi encerrada porque o anfitrião desconectou."
      : "A sala foi encerrada porque o anfitrião saiu."
    : reason === "disconnect"
      ? "A sala foi encerrada porque um jogador desconectou."
      : "A sala foi encerrada porque um jogador saiu da partida.";

  io.to(room.code).emit("room_closed", {
    code: room.code,
    reason: closeReason,
    message,
  });

  roomStore.deleteRoom(room.code);
}

function scheduleLobbyExpiry(
  io: StopNamespace,
  room: StopMultiplayerRoom,
): void {
  if (room.waitingTimeout) {
    clearTimeout(room.waitingTimeout);
    room.waitingTimeout = null;
  }

  if (room.state.status !== "lobby") {
    return;
  }

  room.waitingTimeout = setTimeout(() => {
    const latestRoom = roomStore.getRoom(room.code);
    if (!latestRoom || latestRoom.state.status !== "lobby") {
      return;
    }

    io.to(latestRoom.code).emit("room_closed", {
      code: latestRoom.code,
      reason: "room_expired",
      message: "A sala expirou porque a partida não começou a tempo.",
    });
    roomStore.deleteRoom(latestRoom.code);
  }, WAITING_ROOM_TTL_MS);
}

function scheduleRoundPhase(
  io: StopNamespace,
  room: StopMultiplayerRoom,
): void {
  clearRoundPhaseTimeout(room);

  if (room.state.status !== "playing" || !room.state.currentRound) {
    return;
  }

  const { roundNumber, phase, phaseEndsAt } = room.state.currentRound;
  const delay = Math.max(0, phaseEndsAt - Date.now());

  room.roundPhaseTimeout = setTimeout(() => {
    const latestRoom = roomStore.getRoom(room.code);
    if (
      !latestRoom ||
      latestRoom.state.status !== "playing" ||
      !latestRoom.state.currentRound ||
      latestRoom.state.currentRound.roundNumber !== roundNumber ||
      latestRoom.state.currentRound.phase !== phase
    ) {
      return;
    }

    if (phase === "countdown") {
      latestRoom.state = moveStopRoomToPlaying(latestRoom.state, Date.now());
      latestRoom.updatedAt = Date.now();
      emitStateUpdated(io, latestRoom);
      scheduleRoundPhase(io, latestRoom);
      return;
    }

    if (phase === "playing") {
      lockActiveRound(io, latestRoom, null, Date.now());
      return;
    }

    if (phase === "locked") {
      latestRoom.state = moveStopRoomToResults(latestRoom.state, Date.now());
      latestRoom.updatedAt = Date.now();
      emitStateUpdated(io, latestRoom);
      scheduleRoundPhase(io, latestRoom);
      return;
    }

    finalizeResultsPhase(io, latestRoom);
  }, delay);
}

function lockActiveRound(
  io: StopNamespace,
  room: StopMultiplayerRoom,
  stoppedByPlayerId: string | null,
  now: number,
): void {
  if (room.state.status !== "playing" || room.state.currentRound?.phase !== "playing") {
    return;
  }

  room.state = resolveStopRoomRoundLock(
    room.state,
    room.answerSnapshotsByPlayerId,
    stoppedByPlayerId,
    now,
  );
  room.updatedAt = now;
  emitStateUpdated(io, room);
  scheduleRoundPhase(io, room);
}

function finalizeResultsPhase(
  io: StopNamespace,
  room: StopMultiplayerRoom,
): void {
  const now = Date.now();
  const archivedState = archiveStopRoomCurrentRound(room.state, now);
  const nextState = advanceStopRoomRound(archivedState, now);

  room.state = nextState;
  room.updatedAt = now;
  room.answerSnapshotsByPlayerId =
    room.state.status === "playing" && room.state.currentRound
      ? createEmptyAnswerSnapshots(room)
      : {};

  emitStateUpdated(io, room);
  scheduleRoundPhase(io, room);
}

function createEmptyAnswerSnapshots(
  room: Pick<StopMultiplayerRoom, "state">,
): Record<string, string[]> {
  const boxCount = room.state.currentRound?.round.boxes.length ?? 0;

  return room.state.players.reduce<Record<string, string[]>>((snapshots, player) => {
    snapshots[player.id] = Array.from({ length: boxCount }, () => "");
    return snapshots;
  }, {});
}

function clearRoundPhaseTimeout(room: StopMultiplayerRoom): void {
  if (room.roundPhaseTimeout) {
    clearTimeout(room.roundPhaseTimeout);
    room.roundPhaseTimeout = null;
  }
}

function leaveAnyExistingRoom(
  io: StopNamespace,
  socket: StopSocket,
): void {
  const room = roomStore.findRoomBySocketId(socket.id);
  if (!room) {
    return;
  }

  handlePlayerExit(io, room, socket.id, "leave_room");
}

function getParticipantBySocketId(
  room: StopMultiplayerRoom,
  socketId: string,
): StopRoomParticipant | null {
  return room.participants.find(
    (participant) => participant.socketId === socketId,
  ) ?? null;
}

function emitStateUpdated(io: StopNamespace, room: StopMultiplayerRoom): void {
  io.to(room.code).emit("state_updated", {
    code: room.code,
    state: room.state,
  });
}

function normalizePlayerName(playerName: string): string | null {
  const normalizedName = playerName.trim().slice(0, 20);
  return normalizedName.length >= 2 ? normalizedName : null;
}

function areAllAnswersFilled(answers: readonly string[]): boolean {
  return answers.every((answer) => answer.trim().length > 0);
}

function emitError(
  socket: StopSocket,
  code: MultiplayerErrorCode,
  message: string,
): void {
  socket.emit("multiplayer_error", { code, message });
}

function getErrorMessage(code: StopMultiplayerLogicErrorCode | MultiplayerErrorCode): string {
  switch (code) {
    case "room_full":
      return "Essa sala já está cheia.";
    case "room_not_joinable":
      return "Essa sala não aceita novos jogadores agora.";
    case "unauthorized":
      return "Você não pertence a esta sala.";
    case "host_only":
      return "Só o anfitrião pode fazer isso.";
    case "invalid_settings":
      return "As configurações da sala são inválidas.";
    case "not_enough_players":
      return "São necessários pelo menos 2 jogadores para começar.";
    case "invalid_name":
      return "Digite um nome com pelo menos 2 letras.";
    case "room_not_found":
      return "Sala não encontrada.";
    case "round_not_active":
      return "Essa rodada já foi encerrada.";
    case "answers_incomplete":
      return "Preencha todas as caixas antes de apertar STOP.";
    case "server_error":
      return "O servidor encontrou um erro inesperado.";
    default:
      return "Não foi possível concluir a ação.";
  }
}
