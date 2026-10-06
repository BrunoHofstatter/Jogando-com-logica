export interface TutorialIdentity {
  game: string;
  scope: "core" | "mode" | "contextual";
  version: number;
  mode?: string;
}

export interface TutorialHistory { completed: boolean; dismissed: boolean }
const memory = new Map<string, TutorialHistory>();
export const tutorialKey = (id: TutorialIdentity) =>
  `playable-tutorial:${id.game}:${id.scope}:${id.mode ?? ""}:v${id.version}`;

export function readTutorialHistory(id: TutorialIdentity): TutorialHistory {
  const key = tutorialKey(id);
  let stored: TutorialHistory = { completed: false, dismissed: false };
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (raw && typeof raw === "object" && "completed" in raw && "dismissed" in raw) {
      stored = { completed: raw.completed === true, dismissed: raw.dismissed === true };
    }
  } catch { /* Storage may be disabled on classroom devices. */ }
  const cached = memory.get(key);
  return {
    completed: stored.completed || cached?.completed === true,
    dismissed: stored.dismissed || cached?.dismissed === true,
  };
}

export function recordTutorialHistory(id: TutorialIdentity, outcome: "completed" | "dismissed") {
  const history = { ...readTutorialHistory(id), [outcome]: true };
  memory.set(tutorialKey(id), history);
  try { localStorage.setItem(tutorialKey(id), JSON.stringify(history)); } catch { /* Memory fallback. */ }
}

export function unseenLessons(lessons: readonly TutorialIdentity[]) {
  return lessons.filter(id => {
    const history = readTutorialHistory(id);
    return !history.completed && !history.dismissed;
  });
}
