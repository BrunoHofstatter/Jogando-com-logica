import type { BombRole } from "./level1";
import type { PlayerSeat, RolePreference } from "./multiplayer/protocol";

export function assignBombRoles(
  first: RolePreference,
  second: RolePreference,
  random: () => number = Math.random,
): [BombRole, BombRole] {
  if (first === "bomb" && second !== "bomb") return ["bomb", "manual"];
  if (first === "manual" && second !== "manual") return ["manual", "bomb"];
  if (second === "bomb" && first !== "bomb") return ["manual", "bomb"];
  if (second === "manual" && first !== "manual") return ["bomb", "manual"];
  return random() < 0.5 ? ["bomb", "manual"] : ["manual", "bomb"];
}

export function updateReplayVotes(
  current: readonly PlayerSeat[],
  seat: PlayerSeat,
  wantsReplay: boolean,
): PlayerSeat[] {
  const votes = new Set(current);
  if (wantsReplay) votes.add(seat);
  else votes.delete(seat);
  return [...votes].sort();
}
