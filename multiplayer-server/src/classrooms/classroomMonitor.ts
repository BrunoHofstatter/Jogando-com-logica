import type {
  ClassroomCode,
  ClassroomMonitorGame,
  ClassroomMonitorRoom,
  ClassroomMonitorUpdatedPayload,
} from "../../../src/CrownChase/Logic/multiplayer/protocol.ts";

type ClassroomRoomProvider = (classroomCode: ClassroomCode) => ClassroomMonitorRoom[];

export type ClassroomMonitor = ReturnType<typeof createClassroomMonitor>;

export function createClassroomMonitor(
  onUpdate: (payload: ClassroomMonitorUpdatedPayload) => void,
) {
  const providers = new Map<ClassroomMonitorGame, ClassroomRoomProvider>();

  const registerProvider = (
    game: ClassroomMonitorGame,
    provider: ClassroomRoomProvider,
  ): void => {
    providers.set(game, provider);
  };

  const getRooms = (classroomCode: ClassroomCode): ClassroomMonitorRoom[] => {
    const statusOrder = { waiting: 0, playing: 1, ended: 2 } as const;

    return [...providers.values()]
      .flatMap((provider) => provider(classroomCode))
      .sort((left, right) =>
        statusOrder[left.status] - statusOrder[right.status]
        || left.createdAt - right.createdAt
        || left.code.localeCompare(right.code),
      );
  };

  const notifyClassroomChanged = (classroomCode: ClassroomCode | null): void => {
    if (!classroomCode) {
      return;
    }

    onUpdate({
      classroomCode,
      rooms: getRooms(classroomCode),
    });
  };

  return {
    registerProvider,
    getRooms,
    notifyClassroomChanged,
  };
}

export function getClassroomMonitorChannel(classroomCode: ClassroomCode): string {
  return `classroom-monitor:${classroomCode}`;
}
