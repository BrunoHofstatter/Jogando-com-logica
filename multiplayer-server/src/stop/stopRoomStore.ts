import type { StopMultiplayerRoom } from "./stopRoomTypes.ts";

export function createStopRoomStore() {
  const rooms = new Map<string, StopMultiplayerRoom>();

  const getRooms = (): Map<string, StopMultiplayerRoom> => rooms;

  const getRoom = (code: string): StopMultiplayerRoom | undefined =>
    rooms.get(code);

  const setRoom = (room: StopMultiplayerRoom): void => {
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

    if (room.roundPhaseTimeout) {
      clearTimeout(room.roundPhaseTimeout);
    }

    rooms.delete(code);
  };

  const findRoomBySocketId = (socketId: string): StopMultiplayerRoom | undefined => {
    for (const room of rooms.values()) {
      if (room.participants.some((participant) => participant.socketId === socketId)) {
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
