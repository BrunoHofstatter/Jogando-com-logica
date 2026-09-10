export type BombLevelId = 1 | 3;

export const BOMB_LEVELS = [
  { id: 1, title: "Números", durationSeconds: 180, lives: 3, sections: 3 },
  { id: 3, title: "Navegação", durationSeconds: 252, lives: 3, sections: 2 },
] as const;

export function isBombLevelId(value: unknown): value is BombLevelId { return value === 1 || value === 3; }
export function getBombLevel(id: BombLevelId) { return BOMB_LEVELS.find((level) => level.id === id)!; }
