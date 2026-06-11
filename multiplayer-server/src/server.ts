import http from "node:http";

import express from "express";
import { Server, type Namespace } from "socket.io";

import type {
  CacaSomaClientToServerEvents,
  CacaSomaServerToClientEvents,
} from "../../src/Caca_soma/Logic/multiplayer/protocol.ts";
import type {
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents,
} from "../../src/CrownChase/Logic/multiplayer/protocol.ts";
import type {
  MathWarClientToServerEvents,
  MathWarServerToClientEvents,
} from "../../src/MathWar/Logic/multiplayer/protocol.ts";
import type {
  StopClientToServerEvents,
  StopServerToClientEvents,
} from "../../src/Stop/Logic/multiplayer/protocol.ts";
import type {
  SptttClientToServerEvents,
  SptttServerToClientEvents,
} from "../../src/SPTTT/Logic/multiplayer/protocol.ts";
import { registerRoomHandlers } from "./sockets/registerRoomHandlers.ts";
import { registerCacaSomaRoomHandlers } from "./sockets/registerCacaSomaRoomHandlers.ts";
import { registerMathWarRoomHandlers } from "./sockets/registerMathWarRoomHandlers.ts";
import { registerStopRoomHandlers } from "./sockets/registerStopRoomHandlers.ts";
import { registerSptttRoomHandlers } from "./sockets/registerSptttRoomHandlers.ts";
import { createClassroomStore } from "./classrooms/classroomStore.ts";

export function createMultiplayerServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const allowedOrigins = resolveAllowedOrigins(process.env.CLIENT_ORIGINS);
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length === 0 ? true : allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "jogando-com-logica-multiplayer",
      timestamp: new Date().toISOString(),
    });
  });

  const crownChaseNamespace = io.of("/") as Namespace<
    CrownChaseClientToServerEvents,
    CrownChaseServerToClientEvents
  >;
  const cacaSomaNamespace = io.of("/caca-soma") as Namespace<
    CacaSomaClientToServerEvents,
    CacaSomaServerToClientEvents
  >;
  const mathWarNamespace = io.of("/math-war") as Namespace<
    MathWarClientToServerEvents,
    MathWarServerToClientEvents
  >;
  const stopNamespace = io.of("/stop") as Namespace<
    StopClientToServerEvents,
    StopServerToClientEvents
  >;
  const sptttNamespace = io.of("/spttt") as Namespace<
    SptttClientToServerEvents,
    SptttServerToClientEvents
  >;

  const classroomStore = createClassroomStore((classroomCode) => {
    const payload = {
      classroomCode,
      message: "Essa turma não está mais disponível.",
    };

    crownChaseNamespace.to(getClassroomChannel(classroomCode)).emit("classroom_unavailable", payload);
    sptttNamespace.to(getClassroomChannel(classroomCode)).emit("classroom_unavailable", payload);
    mathWarNamespace.to(getClassroomChannel(classroomCode)).emit("classroom_unavailable", payload);
    cacaSomaNamespace.to(getClassroomChannel(classroomCode)).emit("classroom_unavailable", payload);
    stopNamespace.to(getClassroomChannel(classroomCode)).emit("classroom_unavailable", payload);
  });

  registerRoomHandlers(crownChaseNamespace, classroomStore);
  registerCacaSomaRoomHandlers(cacaSomaNamespace, classroomStore);
  registerMathWarRoomHandlers(mathWarNamespace, classroomStore);
  registerStopRoomHandlers(stopNamespace, classroomStore);
  registerSptttRoomHandlers(sptttNamespace, classroomStore);

  return {
    app,
    httpServer,
    io,
  };
}

function resolveAllowedOrigins(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function getClassroomChannel(classroomCode: string): string {
  return `classroom:${classroomCode}`;
}
