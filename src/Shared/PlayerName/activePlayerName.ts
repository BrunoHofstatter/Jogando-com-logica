const STORAGE_KEY = "active_player_name_v1";
const MAX_NAME_LENGTH = 20;

export function normalizePlayerName(value: string): string {
  return value.trim().slice(0, MAX_NAME_LENGTH);
}

export function getActivePlayerName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizePlayerName(
    window.localStorage.getItem(STORAGE_KEY) ?? "",
  );
}

export function setActivePlayerName(playerName: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedName = normalizePlayerName(playerName);
  if (normalizedName) {
    window.localStorage.setItem(STORAGE_KEY, normalizedName);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
