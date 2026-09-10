import { applyLevel1Intent, createLevel1State, type BombRole, type Level1Intent, type Level1State } from "./level1.ts";
import type { BombLevelId } from "./levelCatalog.ts";
import { applyNavigationIntent, createNavigationState, type NavigationIntent, type NavigationState } from "./navigation.ts";

export type BombLevelState = { id: 1; state: Level1State } | { id: 3; state: NavigationState };
export type BombGameIntent = Level1Intent | NavigationIntent;

export function createBombLevel(id: BombLevelId, random: () => number = Math.random): BombLevelState {
  return id === 1 ? { id, state: createLevel1State(random) } : { id, state: createNavigationState(random) };
}

export function applyBombLevelIntent(level: BombLevelState, role: BombRole, intent: unknown) {
  if (level.id === 3) return applyNavigationIntent(level.state, role, intent);
  if (role !== "bomb" || !isLevel1Intent(intent)) return { accepted: false, mistake: false, completed: false };
  return applyLevel1Intent(level.state, intent);
}

function isLevel1Intent(raw: unknown): raw is Level1Intent {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as Record<string, unknown>;
  if (value.type === "select_ordering_number") return Number.isInteger(value.value);
  if (value.row !== 0 && value.row !== 1 && value.row !== 2) return false;
  if (value.type === "submit_numeric_answer") return Number.isInteger(value.value);
  return value.type === "select_operator" && (value.value === "+" || value.value === "-" || value.value === "*");
}
