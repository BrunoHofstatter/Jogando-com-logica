interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  removeItem(key: string): void;
}

const PLAYER_PROGRESS_KEYS = new Set([
  "active_player_name_v1",
  "cacasoma_level_progress",
  "hasSeenRubiksClass1",
]);

const PLAYER_PROGRESS_PREFIXES = [
  "game_progress_",
  "stop_level_stars_",
];

export function isLocalPlayerProgressKey(key: string): boolean {
  return (
    PLAYER_PROGRESS_KEYS.has(key) ||
    PLAYER_PROGRESS_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
    (key.startsWith("tutorial_") && key.endsWith("_completed"))
  );
}

export function resetLocalPlayerProgress(storage: StorageLike): number {
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && isLocalPlayerProgressKey(key)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
  return keysToRemove.length;
}
