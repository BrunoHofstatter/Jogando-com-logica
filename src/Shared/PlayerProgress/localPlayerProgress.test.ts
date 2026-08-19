import { describe, expect, it } from "vitest";

import {
  isLocalPlayerProgressKey,
  resetLocalPlayerProgress,
} from "./localPlayerProgress";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }
}

describe("local player progress reset", () => {
  it("recognizes the complete player-specific key inventory", () => {
    expect(isLocalPlayerProgressKey("active_player_name_v1")).toBe(true);
    expect(isLocalPlayerProgressKey("activeGameSession")).toBe(true);
    expect(isLocalPlayerProgressKey("cacasoma_level_progress")).toBe(true);
    expect(isLocalPlayerProgressKey("hasSeenRubiksClass1")).toBe(true);
    expect(isLocalPlayerProgressKey("tutorial_stop_v1_completed")).toBe(true);
    expect(isLocalPlayerProgressKey("game_progress_mathwar")).toBe(true);
    expect(isLocalPlayerProgressKey("stop_level_stars_4")).toBe(true);
  });

  it("clears player progress while preserving classroom and unrelated state", () => {
    const storage = new MemoryStorage();
    const playerKeys = [
      "active_player_name_v1",
      "activeGameSession",
      "cacasoma_level_progress",
      "hasSeenRubiksClass1",
      "tutorial_crownchase_v1_completed",
      "tutorial_cacasoma_levels_v1_completed",
      "game_progress_mathwar",
      "stop_level_stars_3",
    ];
    const preservedKeys = [
      "active_classroom_session_v1",
      "managed_classroom_tokens_v1",
      "unrelated_preference",
    ];

    [...playerKeys, ...preservedKeys].forEach((key) => storage.setItem(key, "value"));

    expect(resetLocalPlayerProgress(storage)).toBe(playerKeys.length);
    playerKeys.forEach((key) => expect(storage.has(key)).toBe(false));
    preservedKeys.forEach((key) => expect(storage.has(key)).toBe(true));
  });
});
