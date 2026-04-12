import http from "node:http";

import express from "express";
import { Server, type Namespace } from "socket.io";

import type {
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents,
} from "../../src/CrownChase/Logic/multiplayer/protocol.ts";
import type {
  MathWarClientToServerEvents,
  MathWarServerToClientEvents,
} from "../../src/MathWar/Logic/multiplayer/protocol.ts";
import { registerRoomHandlers } from "./sockets/registerRoomHandlers.ts";
import { registerMathWarRoomHandlers } from "./sockets/registerMathWarRoomHandlers.ts";

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
  const mathWarNamespace = io.of("/math-war") as Namespace<
    MathWarClientToServerEvents,
    MathWarServerToClientEvents
  >;

  registerRoomHandlers(crownChaseNamespace);
  registerMathWarRoomHandlers(mathWarNamespace);

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
