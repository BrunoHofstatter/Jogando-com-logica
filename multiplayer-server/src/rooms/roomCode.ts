import { ROOM_CODE_LENGTH } from "./roomTypes.ts";

const ROOM_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(existingCodes: Set<string>): string {
  let nextCode = "";

  do {
    nextCode = Array.from({ length: ROOM_CODE_LENGTH }, () =>
      ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)],
    ).join("");
  } while (existingCodes.has(nextCode));

  return nextCode;
}
