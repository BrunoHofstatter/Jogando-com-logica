import { ROUTES } from "../../routes";

export interface TutorialReturn { destination: string; difficulty?: number }
export const menuReturn: TutorialReturn = { destination: ROUTES.CROWN_CHASE_RULES };

export function allowedDifficulty(value: unknown): number {
  let unlocked = 1;
  try {
    const saved = Number(localStorage.getItem("game_progress_crownchase"));
    if (Number.isInteger(saved) && saved >= 1 && saved <= 4) unlocked = saved;
  } catch { /* Default to the first difficulty. */ }
  const requested = Number(value);
  return Number.isInteger(requested) && requested >= 1 && requested <= unlocked ? requested : 1;
}

export function validateReturn(value: unknown): TutorialReturn {
  if (!value || typeof value !== "object" || !("destination" in value)) return menuReturn;
  if (value.destination === ROUTES.CROWN_CHASE_AI) return { destination: value.destination, difficulty: allowedDifficulty("difficulty" in value ? value.difficulty : 1) };
  if (value.destination === ROUTES.CROWN_CHASE_GAME || value.destination === ROUTES.CROWN_CHASE_MP_LOBBY) return { destination: value.destination };
  return menuReturn;
}

const contextKey = "crown-chase-tutorial-return";
export function readReturn(state: unknown, entry: string): TutorialReturn {
  if (state && typeof state === "object" && "tutorialReturn" in state) return validateReturn(state.tutorialReturn);
  try {
    const saved = JSON.parse(sessionStorage.getItem(contextKey) ?? "null");
    if (saved?.entry === entry && entry !== "default") return validateReturn(saved.context);
  } catch { /* Direct entry safely returns to menu. */ }
  return menuReturn;
}
export function saveReturn(context: TutorialReturn, entry: string) {
  try { sessionStorage.setItem(contextKey, JSON.stringify({ entry, context })); } catch { /* Router history still holds context. */ }
}
export function clearReturn() {
  try { sessionStorage.removeItem(contextKey); } catch { /* No storage required. */ }
}
