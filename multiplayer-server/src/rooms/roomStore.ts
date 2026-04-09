import type { CrownChaseRoom } from "./roomTypes.ts";

const rooms = new Map<string, CrownChaseRoom>();

export function getRooms(): Map<string, CrownChaseRoom> {
  return rooms;
}

export function getRoom(code: string): CrownChaseRoom | undefined {
  return rooms.get(code);
}

export function setRoom(room: CrownChaseRoom): void {
  rooms.set(room.code, room);
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (!room) {
    return;
  }

  if (room.waitingTimeout) {
    clearTimeout(room.waitingTimeout);
  }

  if (room.closeTimeout) {
    clearTimeout(room.closeTimeout);
  }

  rooms.delete(code);
}

export function findRoomBySocketId(socketId: string): CrownChaseRoom | undefined {
  for (const room of rooms.values()) {
    const hasSocket = room.players.some((player) => player?.socketId === socketId);
    if (hasSocket) {
      return room;
    }
  }

  return undefined;
}
