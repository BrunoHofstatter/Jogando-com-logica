type RoomStorePlayer = {
  socketId: string;
};

type RoomStoreShape = {
  code: string;
  players: readonly (RoomStorePlayer | null)[];
  waitingTimeout: NodeJS.Timeout | null;
  closeTimeout: NodeJS.Timeout | null;
};

export function createRoomStore<TRoom extends RoomStoreShape>() {
  const rooms = new Map<string, TRoom>();

  const getRooms = (): Map<string, TRoom> => rooms;

  const getRoom = (code: string): TRoom | undefined => rooms.get(code);

  const setRoom = (room: TRoom): void => {
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
  ): TRoom | undefined => {
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
