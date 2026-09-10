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
  private pendingRequestId: string | null = null;

  constructor(private readonly events: ClassroomCreationEvents = analytics) {}

  start(requestId: string): boolean {
    if (this.pendingRequestId !== null) {
      return false;
    }

    this.pendingRequestId = requestId;
    return true;
  }

  succeed(requestId: string): boolean {
    if (this.pendingRequestId !== requestId) {
      return false;
    }

    this.pendingRequestId = null;
    this.events.classroomCreateResult({ success: true });
    return true;
  }

  fail(requestId: string, errorCode: ClassroomCreateErrorCode): boolean {
    if (this.pendingRequestId !== requestId) {
      return false;
    }

    this.pendingRequestId = null;
    this.events.classroomCreateResult({ success: false, errorCode });
    return true;
  }

  cancel(): void {
    this.pendingRequestId = null;
  }
}
