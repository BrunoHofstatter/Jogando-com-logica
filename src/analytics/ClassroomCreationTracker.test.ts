import { describe, expect, it, vi } from "vitest";

import { ClassroomCreationTracker } from "./ClassroomCreationTracker";

describe("ClassroomCreationTracker", () => {
  it("emits one success only after a pending request", () => {
    const classroomCreateResult = vi.fn(() => true);
    const tracker = new ClassroomCreationTracker({ classroomCreateResult });

    expect(tracker.succeed()).toBe(false);
    expect(tracker.start()).toBe(true);
    expect(tracker.start()).toBe(false);
    expect(tracker.succeed()).toBe(true);
    expect(tracker.succeed()).toBe(false);
    expect(classroomCreateResult).toHaveBeenCalledOnce();
    expect(classroomCreateResult).toHaveBeenCalledWith({ success: true });
  });

  it("emits only a controlled failure code for a pending request", () => {
    const classroomCreateResult = vi.fn(() => true);
    const tracker = new ClassroomCreationTracker({ classroomCreateResult });

    tracker.start();
    expect(tracker.fail("server_error")).toBe(true);
    expect(classroomCreateResult).toHaveBeenCalledWith({
      success: false,
      errorCode: "server_error",
    });
  });

  it("can cancel a disconnected request without inventing a server result", () => {
    const classroomCreateResult = vi.fn(() => true);
    const tracker = new ClassroomCreationTracker({ classroomCreateResult });

    tracker.start();
    tracker.cancel();

    expect(tracker.fail("server_error")).toBe(false);
    expect(classroomCreateResult).not.toHaveBeenCalled();
  });
});
