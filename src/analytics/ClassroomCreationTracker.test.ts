import { describe, expect, it, vi } from "vitest";

import { ClassroomCreationTracker } from "./ClassroomCreationTracker";

describe("ClassroomCreationTracker", () => {
  it("emits one success only after a pending request", () => {
    const classroomCreateResult = vi.fn(() => true);
    const tracker = new ClassroomCreationTracker({ classroomCreateResult });

    expect(tracker.succeed("request-1")).toBe(false);
    expect(tracker.start("request-1")).toBe(true);
    expect(tracker.start("request-2")).toBe(false);
    expect(tracker.succeed("request-1")).toBe(true);
    expect(tracker.succeed("request-1")).toBe(false);
    expect(classroomCreateResult).toHaveBeenCalledOnce();
    expect(classroomCreateResult).toHaveBeenCalledWith({ success: true });
  });

  it("emits only a controlled failure code for a pending request", () => {
    const classroomCreateResult = vi.fn(() => true);
    const tracker = new ClassroomCreationTracker({ classroomCreateResult });

    tracker.start("request-1");
    expect(tracker.fail("request-1", "server_error")).toBe(true);
    expect(classroomCreateResult).toHaveBeenCalledWith({
      success: false,
      errorCode: "server_error",
    });
  });

  it("can cancel a disconnected request without inventing a server result", () => {
    const classroomCreateResult = vi.fn(() => true);
    const tracker = new ClassroomCreationTracker({ classroomCreateResult });

    tracker.start("request-1");
    tracker.cancel();

    expect(tracker.fail("request-1", "server_error")).toBe(false);
    expect(classroomCreateResult).not.toHaveBeenCalled();
  });

  it("ignores late results from an older request", () => {
    const classroomCreateResult = vi.fn(() => true);
    const tracker = new ClassroomCreationTracker({ classroomCreateResult });

    tracker.start("request-1");
    tracker.cancel();
    tracker.start("request-2");

    expect(tracker.succeed("request-1")).toBe(false);
    expect(tracker.fail("request-2", "timeout")).toBe(true);
    expect(classroomCreateResult).toHaveBeenCalledOnce();
    expect(classroomCreateResult).toHaveBeenCalledWith({
      success: false,
      errorCode: "timeout",
    });
  });
});
