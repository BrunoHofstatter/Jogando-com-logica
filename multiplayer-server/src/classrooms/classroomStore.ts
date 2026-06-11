import { randomUUID } from "node:crypto";

import type {
  ClassroomCode,
  ManagedClassroom,
} from "../../../src/CrownChase/Logic/multiplayer/protocol.ts";

export const CLASSROOM_TTL_MS = 8 * 60 * 60 * 1000;

const CLASSROOM_CODE_LENGTH = 4;
const CLASSROOM_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ";

type TemporaryClassroom = ManagedClassroom & {
  expiryTimeout: NodeJS.Timeout;
};

export type ClassroomStore = ReturnType<typeof createClassroomStore>;

export function createClassroomStore(onDelete: (code: ClassroomCode) => void) {
  const classrooms = new Map<ClassroomCode, TemporaryClassroom>();

  const deleteClassroom = (code: ClassroomCode): boolean => {
    const classroom = classrooms.get(code);
    if (!classroom) {
      return false;
    }

    clearTimeout(classroom.expiryTimeout);
    classrooms.delete(code);
    onDelete(code);
    return true;
  };

  const createClassroom = (): ManagedClassroom => {
    const code = generateClassroomCode(new Set(classrooms.keys()));
    const classroom: TemporaryClassroom = {
      code,
      managementToken: randomUUID(),
      expiresAt: Date.now() + CLASSROOM_TTL_MS,
      expiryTimeout: setTimeout(() => deleteClassroom(code), CLASSROOM_TTL_MS),
    };

    classrooms.set(code, classroom);
    return serializeClassroom(classroom);
  };

  const getClassroom = (code: ClassroomCode): ManagedClassroom | undefined => {
    const classroom = classrooms.get(code);
    return classroom ? serializeClassroom(classroom) : undefined;
  };

  const getManagedClassrooms = (managementTokens: string[]): ManagedClassroom[] => {
    const tokenSet = new Set(managementTokens);
    return [...classrooms.values()]
      .filter((classroom) => tokenSet.has(classroom.managementToken))
      .map(serializeClassroom)
      .sort((left, right) => left.expiresAt - right.expiresAt);
  };

  return {
    createClassroom,
    deleteClassroom,
    getClassroom,
    getManagedClassrooms,
  };
}

function generateClassroomCode(existingCodes: Set<ClassroomCode>): ClassroomCode {
  let nextCode = "";

  do {
    nextCode = Array.from({ length: CLASSROOM_CODE_LENGTH }, () =>
      CLASSROOM_CODE_CHARS[Math.floor(Math.random() * CLASSROOM_CODE_CHARS.length)],
    ).join("");
  } while (existingCodes.has(nextCode));

  return nextCode;
}

function serializeClassroom(classroom: TemporaryClassroom): ManagedClassroom {
  return {
    code: classroom.code,
    managementToken: classroom.managementToken,
    expiresAt: classroom.expiresAt,
  };
}
