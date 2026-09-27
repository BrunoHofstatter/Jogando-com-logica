// Socket.IO types describe trusted callers, not packets arriving over the network.
export function isBombPayload(event: string, payload: unknown): boolean {
  if (event === "sync_time") return typeof payload === "function";
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const p = payload as Record<string, unknown>;
  const string = (key: string) => typeof p[key] === "string" && (p[key] as string).length <= 100;
  switch (event) {
    case "create_room": return string("playerName") && (p.hintsEnabled === undefined || typeof p.hintsEnabled === "boolean") && (p.classroomCode === undefined || string("classroomCode"));
    case "join_room": return string("code") && string("playerName");
    case "set_role_preference": return string("code") && ["bomb", "manual", "either"].includes(p.preference as string);
    case "set_ready": return string("code") && typeof p.ready === "boolean";
    case "set_replay_vote": return string("code") && typeof p.wantsReplay === "boolean";
    case "submit_action": return string("code") && string("actionId") && (p.roundId === undefined || string("roundId"));
    case "join_classroom": case "leave_classroom": case "leave_room": return string("code");
    case "list_open_rooms": return string("classroomCode");
    default: return false;
  }
}
