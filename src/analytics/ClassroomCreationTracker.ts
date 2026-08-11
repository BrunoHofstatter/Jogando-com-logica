import {
  analytics,
  type ClassroomCreateErrorCode,
} from "./events";

interface ClassroomCreationEvents {
  classroomCreateResult: (parameters: {
    success: boolean;
    errorCode?: ClassroomCreateErrorCode;
  }) => boolean;
}

export class ClassroomCreationTracker {
  private pending = false;

  constructor(private readonly events: ClassroomCreationEvents = analytics) {}

  start(): boolean {
    if (this.pending) {
      return false;
    }

    this.pending = true;
    return true;
  }

  succeed(): boolean {
    if (!this.pending) {
      return false;
    }

    this.pending = false;
    this.events.classroomCreateResult({ success: true });
    return true;
  }

  fail(errorCode: ClassroomCreateErrorCode): boolean {
    if (!this.pending) {
      return false;
    }

    this.pending = false;
    this.events.classroomCreateResult({ success: false, errorCode });
    return true;
  }

  cancel(): void {
    this.pending = false;
  }
}
