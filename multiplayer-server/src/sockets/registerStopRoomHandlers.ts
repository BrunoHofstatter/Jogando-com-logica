import { randomUUID } from "node:crypto";

import type { Namespace, Socket } from "socket.io";

import {
  normalizeStopAnswerSnapshot,
  type StopMultiplayerLogicErrorCode,
} from "../../../src/Stop/Logic/multiplayer/matchLogic.ts";
import type {
  ClassroomCode,
  MultiplayerErrorCode,
  StopClientToServerEvents,
  StopOpenRoomSummary,
  StopServerToClientEvents,
} from "../../../src/Stop/Logic/multiplayer/protocol.ts";
import {
  addStopRoomPlayer,
  addStopRoomRematchVote,
  advanceStopRoomRound,
  archiveStopRoomCurrentRound,
  createStopRoomInitialState,
  markStopRoomPlayerConnection,
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
import type { ClassroomStore } from "../classrooms/classroomStore.ts";
import type { ClassroomMonitor } from "../classrooms/classroomMonitor.ts";

type StopNamespace = Namespace<
  StopClientToServerEvents,
  StopServerToClientEvents
>;

type StopSocket = Socket<
  StopClientToServerEvents,
  StopServerToClientEvents
>;

const roomStore = createStopRoomStore();
let activeClassroomMonitor: ClassroomMonitor;

export function registerStopRoomHandlers(
  io: StopNamespace,
  classroomStore: ClassroomStore,
  classroomMonitor: ClassroomMonitor,
): void {
  activeClassroomMonitor = classroomMonitor;
  classroomMonitor.registerProvider("stop", (classroomCode) =>
    [...roomStore.getRooms().values()]
      .filter((room) => room.visibility === "classroom" && room.classroomCode === classroomCode)
      .map((room) => ({
        code: room.code,
        game: "stop",
        status: room.state.status === "lobby" ? "waiting" : room.state.status,
        players: room.state.players.map(({ name, connected }) => ({ name, connected })),
        capacity: room.state.settings.playerLimit,
        createdAt: room.createdAt,
      })),
  );

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
      const playerId = randomUUID();
      const now = Date.now();
      const state = createStopRoomInitialState(playerId, normalizedName, now);
      const room: StopMultiplayerRoom = {
        code: roomCode,
        visibility: normalizedClassroomCode ? "classroom" : "private",
        classroomCode: normalizedClassroomCode,
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
      broadcastClassroomRooms(io, room.classroomCode);
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
      broadcastClassroomRooms(io, room.classroomCode);
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
      broadcastClassroomRooms(io, room.classroomCode);
    });

    socket.on("join_classroom", ({ code }) => {
      const normalizedCode = normalizeClassroomCode(code);
      const classroom = normalizedCode
        ? classroomStore.getClassroom(normalizedCode)
        : undefined;
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
      const classroom = normalizedCode
        ? classroomStore.getClassroom(normalizedCode)
        : undefined;
      if (!normalizedCode || !classroom) {
        emitError(socket, "classroom_not_found", "Turma não encontrada.");
        return;
      }

      socket.emit("classroom_rooms_updated", {
        classroomCode: normalizedCode,
        openRooms: getOpenClassroomRooms(normalizedCode),
      });
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
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const participant = getParticipantBySocketId(room, socket.id);
      if (!participant) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
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

    socket.on("remove_player", ({ code, playerId }) => {
      const room = roomStore.getRoom(code.trim().toUpperCase());
      if (!room) {
        emitError(socket, "room_not_found", "Sala não encontrada.");
        return;
      }

      const hostParticipant = getParticipantBySocketId(room, socket.id);
      const hostPlayer = hostParticipant
        ? room.state.players.find((player) => player.id === hostParticipant.playerId)
        : null;
      if (!hostParticipant || !hostPlayer) {
        emitError(socket, "unauthorized", "Você não pertence a esta sala.");
        return;
      }

      if (!hostPlayer.isHost) {
        emitError(socket, "host_only", "Só o anfitrião pode remover jogadores.");
        return;
      }

      if (room.state.status !== "lobby") {
        emitError(socket, "room_not_joinable", "Não é possível remover jogadores depois que a partida começa.");
        return;
      }

      const targetPlayer = room.state.players.find((player) => player.id === playerId);
      const targetParticipant = room.participants.find(
        (participant) => participant.playerId === playerId,
      );
      if (!targetPlayer || !targetParticipant || targetPlayer.isHost) {
        emitError(socket, "unauthorized", "Esse jogador não pode ser removido.");
        return;
      }

      const result = removeStopRoomPlayer(room.state, playerId, Date.now());
      if (!result.ok) {
        emitError(socket, result.code, getErrorMessage(result.code));
        return;
      }

      io.to(targetParticipant.socketId).emit("player_removed", {
        code: room.code,
        message: "Você foi removido da sala pelo anfitrião.",
      });
      io.sockets.get(targetParticipant.socketId)?.leave(room.code);

      room.state = result.state;
      room.participants = room.participants.filter(
        (participant) => participant.playerId !== playerId,
      );
      delete room.answerSnapshotsByPlayerId[playerId];
      room.updatedAt = Date.now();

      scheduleLobbyExpiry(io, room);
      emitStateUpdated(io, room);
      broadcastClassroomRooms(io, room.classroomCode);
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

  if (room.state.status !== "lobby" && !leavingPlayer.isHost) {
    const result = markStopRoomPlayerConnection(
      room.state,
      participant.playerId,
      false,
      Date.now(),
    );
    if (!result.ok) {
      closeRoom(io, room, leavingPlayer, reason);
      return;
    }

    room.state = result.state;
    room.updatedAt = Date.now();
    room.participants = room.participants.filter(
      (currentParticipant) => currentParticipant.socketId !== socketId,
    );
    emitStateUpdated(io, room);
    return;
  }

  if (leavingPlayer.isHost) {
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
    broadcastClassroomRooms(io, room.classroomCode);
    return;
  }

  room.state = result.state;
  room.updatedAt = Date.now();

  if (room.state.players.length === 0) {
    roomStore.deleteRoom(room.code);
    broadcastClassroomRooms(io, room.classroomCode);
    return;
  }

  scheduleLobbyExpiry(io, room);
  emitStateUpdated(io, room);
  broadcastClassroomRooms(io, room.classroomCode);
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
  broadcastClassroomRooms(io, room.classroomCode);
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
    broadcastClassroomRooms(io, latestRoom.classroomCode);
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
  activeClassroomMonitor.notifyClassroomChanged(room.classroomCode);
}

function normalizeClassroomCode(code: string): ClassroomCode | null {
  const normalizedCode = code.trim().toUpperCase();
  return /^[A-HJ-KM-NP-Z]{4}$/.test(normalizedCode) ? normalizedCode : null;
}

function getClassroomChannel(classroomCode: ClassroomCode): string {
  return `classroom:${classroomCode}`;
}

function getOpenClassroomRooms(classroomCode: ClassroomCode): StopOpenRoomSummary[] {
  return [...roomStore.getRooms().values()]
    .filter((room) =>
      room.visibility === "classroom"
      && room.classroomCode === classroomCode
      && room.state.status === "lobby"
      && room.state.players.some((player) => player.isHost && player.connected)
      && room.state.players.length < room.state.settings.playerLimit,
    )
    .map((room) => {
      const host = room.state.players.find((player) => player.isHost);
      return {
        code: room.code,
        hostName: host?.name ?? "",
        playerCount: room.state.players.length,
        playerLimit: room.state.settings.playerLimit,
        difficulty: room.state.settings.difficulty,
        roundCount: room.state.settings.roundCount,
        progressiveDifficulty: room.state.settings.progressiveDifficulty,
      };
    })
    .sort((left, right) => left.hostName.localeCompare(right.hostName));
}

function broadcastClassroomRooms(
  io: StopNamespace,
  classroomCode: ClassroomCode | null,
): void {
  if (!classroomCode) {
    return;
  }

  io.to(getClassroomChannel(classroomCode)).emit("classroom_rooms_updated", {
    classroomCode,
    openRooms: getOpenClassroomRooms(classroomCode),
  });
  activeClassroomMonitor.notifyClassroomChanged(classroomCode);
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
    case "classroom_not_found":
      return "Turma não encontrada.";
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
