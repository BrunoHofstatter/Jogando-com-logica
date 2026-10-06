import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TutorialSession } from "./TutorialSession";
import { readTutorialHistory, recordTutorialHistory, tutorialKey, unseenLessons, type TutorialIdentity } from "./tutorialHistory";

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("consumes stage activations exactly once and cancels old waits", () => {
  const session = new TutorialSession();
  const initial = session.start("first");
  const stale = vi.fn();
  session.wait(initial, 100, stale);
  const second = session.enter(initial, "second")!;
  expect(session.enter(initial, "third")).toBeNull();
  expect(session.finish(initial, "completed")).toBe(false);
  vi.runAllTimers();
  expect(stale).not.toHaveBeenCalled();
  const current = vi.fn();
  session.wait(second, 100, current);
  vi.advanceTimersByTime(100);
  expect(current).toHaveBeenCalledOnce();
  session.wait(second, 100, stale);
  session.cancel();
  vi.runAllTimers();
  expect(stale).not.toHaveBeenCalled();
  expect(session.current(second)).toBe(false);
});

it("replay invalidates the old session and tokens cannot cross instances", () => {
  const session = new TutorialSession(), other = new TutorialSession();
  const token = session.start("intro");
  other.start("intro");
  expect(other.enter(token, "action")).toBeNull();
  session.start("intro");
  expect(session.enter(token, "action")).toBeNull();
});

it("pauses existing waits and waits created while hidden, retaining cancellation guarantees", () => {
  const session = new TutorialSession();
  const token = session.start("observation"), callback = vi.fn();
  session.wait(token, 3000, callback);
  vi.advanceTimersByTime(1000); session.setPaused(true);
  vi.advanceTimersByTime(30000); expect(callback).not.toHaveBeenCalled();
  session.setPaused(false); vi.advanceTimersByTime(1999); expect(callback).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1); expect(callback).toHaveBeenCalledOnce();
  session.setPaused(true); session.wait(token, 100, callback);
  vi.advanceTimersByTime(1000); expect(callback).toHaveBeenCalledOnce();
  session.cancel(); session.setPaused(false); vi.runAllTimers();
  expect(callback).toHaveBeenCalledOnce();
});

it("keeps completion and dismissal independent, with version and mode isolation", () => {
  const core: TutorialIdentity = { game: "history-test", scope: "core", version: 1 };
  const mode: TutorialIdentity = { game: "history-test", scope: "mode", mode: "levels", version: 1 };
  recordTutorialHistory(core, "completed");
  const replay = new TutorialSession(core);
  replay.finish(replay.start("intro"), "dismissed");
  expect(readTutorialHistory(core)).toEqual({ completed: true, dismissed: true });
  expect(unseenLessons([core, mode, { ...core, version: 2 }])).toEqual([mode, { ...core, version: 2 }]);
  const cancelled = new TutorialSession(mode);
  cancelled.finish(cancelled.start("intro"), "cancelled");
  expect(unseenLessons([mode])).toEqual([mode]);
});

it("survives blocked writes, corrupt records, and blocked storage access", () => {
  const id: TutorialIdentity = { game: "storage-test", scope: "core", version: 1 };
  const storage = { getItem: vi.fn(() => "{bad"), setItem: vi.fn(() => { throw new Error("blocked"); }) };
  vi.stubGlobal("localStorage", storage);
  expect(readTutorialHistory(id)).toEqual({ completed: false, dismissed: false });
  recordTutorialHistory(id, "dismissed");
  expect(storage.setItem).toHaveBeenCalledWith(tutorialKey(id), expect.any(String));
  storage.getItem.mockImplementation(() => { throw new Error("blocked"); });
  expect(unseenLessons([id])).toEqual([]);
});
