import type { AddressInfo } from "node:net";

import { io, type Socket } from "socket.io-client";
import { afterEach, describe, expect, it } from "vitest";

import type {
  ClassroomCreatedPayload,
  ClassroomMonitorUpdatedPayload,
  MultiplayerErrorPayload,
  RoomCreatedPayload,
} from "../../../src/CrownChase/Logic/multiplayer/protocol.ts";
import { createMultiplayerServer } from "../server.ts";

describe("classroom monitor", () => {
  const sockets: Socket[] = [];

  afterEach(() => {
    sockets.forEach((socket) => socket.disconnect());
    sockets.length = 0;
  });

  it("requires the management token and reports live room players", async () => {
    const server = createMultiplayerServer();
    await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
    const port = (server.httpServer.address() as AddressInfo).port;
    const url = `http://127.0.0.1:${port}`;

    try {
      const teacher = await connect(url);
      const host = await connect(url);
      const joiner = await connect(url);

      const classroomCreated = once<ClassroomCreatedPayload>(teacher, "classroom_created");
      teacher.emit("create_classroom", { requestId: "request-1" });
      const { classroom, requestId } = await classroomCreated;
      expect(requestId).toBe("request-1");

      const unauthorized = once<MultiplayerErrorPayload>(teacher, "multiplayer_error");
      teacher.emit("watch_classroom", {
        code: classroom.code,
        managementToken: "invalid-token",
      });
      await expect(unauthorized).resolves.toMatchObject({ code: "unauthorized" });

      const initialMonitor = once<ClassroomMonitorUpdatedPayload>(
        teacher,
        "classroom_monitor_updated",
      );
      teacher.emit("watch_classroom", {
        code: classroom.code,
        managementToken: classroom.managementToken,
      });
      await expect(initialMonitor).resolves.toEqual({
        classroomCode: classroom.code,
        rooms: [],
      });

      const roomCreated = once<RoomCreatedPayload>(host, "room_created");
      const waitingUpdate = once<ClassroomMonitorUpdatedPayload>(
        teacher,
        "classroom_monitor_updated",
      );
      host.emit("create_room", {
        playerName: "Ana",
        classroomCode: classroom.code,
      });
      const createdRoom = await roomCreated;
      await expect(waitingUpdate).resolves.toMatchObject({
        rooms: [{
          code: createdRoom.code,
          game: "crown_chase",
          status: "waiting",
          capacity: 2,
          players: [{ name: "Ana", connected: true }],
        }],
      });

      const playingUpdate = once<ClassroomMonitorUpdatedPayload>(
        teacher,
        "classroom_monitor_updated",
      );
      joiner.emit("join_room", { code: createdRoom.code, playerName: "Bruno" });
      await expect(playingUpdate).resolves.toMatchObject({
        rooms: [{
          code: createdRoom.code,
          status: "playing",
          players: expect.arrayContaining([
            { name: "Ana", connected: true },
            { name: "Bruno", connected: true },
          ]),
        }],
      });

      joiner.emit("leave_room", { code: createdRoom.code });
      const classroomDeleted = once(teacher, "classroom_deleted");
      teacher.emit("delete_classroom", {
        code: classroom.code,
        managementToken: classroom.managementToken,
      });
      await classroomDeleted;
    } finally {
      sockets.forEach((socket) => socket.disconnect());
      await new Promise<void>((resolve) => server.io.close(() => resolve()));
      server.httpServer.close();
    }
  });

  async function connect(url: string): Promise<Socket> {
    const socket = io(url, { forceNew: true, transports: ["websocket"] });
    sockets.push(socket);
    await once(socket, "connect");
    return socket;
  }
});

function once<T = void>(socket: Socket, event: string): Promise<T> {
  return new Promise<T>((resolve) => {
    socket.once(event, resolve as (...args: unknown[]) => void);
  });
}
