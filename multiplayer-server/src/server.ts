import http from "node:http";

import express from "express";
import { Server } from "socket.io";

import type {
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents,
} from "../../src/CrownChase/Logic/multiplayer/protocol.ts";
import { registerRoomHandlers } from "./sockets/registerRoomHandlers.ts";

export function createMultiplayerServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const allowedOrigins = resolveAllowedOrigins(process.env.CLIENT_ORIGINS);
  const io = new Server<
    CrownChaseClientToServerEvents,
    CrownChaseServerToClientEvents
  >(httpServer, {
    cors: {
      origin: allowedOrigins.length === 0 ? true : allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "crown-chase-multiplayer",
      timestamp: new Date().toISOString(),
    });
  });

  registerRoomHandlers(io);

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
