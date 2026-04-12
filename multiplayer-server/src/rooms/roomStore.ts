import type { MultiplayerRoom } from "./roomTypes.ts";

export function createRoomStore<TState>() {
  const rooms = new Map<string, MultiplayerRoom<TState>>();

  const getRooms = (): Map<string, MultiplayerRoom<TState>> => rooms;

  const getRoom = (code: string): MultiplayerRoom<TState> | undefined =>
    rooms.get(code);

  const setRoom = (room: MultiplayerRoom<TState>): void => {
    rooms.set(room.code, room);
  };

  const deleteRoom = (code: string): void => {
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
  };

  const findRoomBySocketId = (
    socketId: string,
  ): MultiplayerRoom<TState> | undefined => {
    for (const room of rooms.values()) {
      const hasSocket = room.players.some((player) => player?.socketId === socketId);
      if (hasSocket) {
        return room;
      }
    }

    return undefined;
  };

  return {
    getRooms,
    getRoom,
    setRoom,
    deleteRoom,
    findRoomBySocketId,
  };
}
