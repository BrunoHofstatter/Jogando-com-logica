const STORAGE_KEY = "active_player_name_v1";
const MAX_NAME_LENGTH = 20;
let memoryName = "";

export function normalizePlayerName(value: string): string {
  return value.trim().slice(0, MAX_NAME_LENGTH);
}

export function getActivePlayerName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    memoryName = normalizePlayerName(window.localStorage.getItem(STORAGE_KEY) ?? "");
  } catch { /* Keep the current name when browser storage is unavailable. */ }
  return memoryName;
}

export function setActivePlayerName(playerName: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedName = normalizePlayerName(playerName);
  memoryName = normalizedName;
  try {
    if (normalizedName) {
      window.localStorage.setItem(STORAGE_KEY, normalizedName);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* The name remains available for this app session. */ }
}
