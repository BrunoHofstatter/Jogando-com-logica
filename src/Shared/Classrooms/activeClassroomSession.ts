import { useEffect, useState } from "react";

export type ActiveClassroomSession = {
  code: string;
  expiresAt: number;
};

const STORAGE_KEY = "active_classroom_session_v1";
const subscribers = new Set<(session: ActiveClassroomSession | null) => void>();
let expiryTimeout: ReturnType<typeof setTimeout> | null = null;
let activeSession = loadSession();

function normalizeSession(value: unknown): ActiveClassroomSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<ActiveClassroomSession>;
  const code = typeof candidate.code === "string"
    ? candidate.code.trim().toUpperCase()
    : "";

  if (!/^[A-HJ-KM-NP-Z]{4}$/.test(code) || typeof candidate.expiresAt !== "number") {
    return null;
  }

  return candidate.expiresAt > Date.now()
    ? { code, expiresAt: candidate.expiresAt }
    : null;
}

function loadSession(): ActiveClassroomSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return normalizeSession(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return null;
  }
}

function scheduleExpiry(): void {
  if (expiryTimeout) {
    clearTimeout(expiryTimeout);
    expiryTimeout = null;
  }

  if (!activeSession || typeof window === "undefined") {
    return;
  }

  expiryTimeout = setTimeout(
    () => clearActiveClassroomSession(),
    Math.max(0, activeSession.expiresAt - Date.now()),
  );
}

function notifySubscribers(): void {
  scheduleExpiry();
  subscribers.forEach((subscriber) => subscriber(activeSession));
}

export function getActiveClassroomSession(): ActiveClassroomSession | null {
  if (activeSession && activeSession.expiresAt <= Date.now()) {
    clearActiveClassroomSession();
  }

  return activeSession;
}

export function setActiveClassroomSession(session: ActiveClassroomSession): void {
  activeSession = normalizeSession(session);

  if (typeof window !== "undefined") {
    if (activeSession) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  notifySubscribers();
}

export function clearActiveClassroomSession(): void {
  activeSession = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  notifySubscribers();
}

export function useActiveClassroomSession(): ActiveClassroomSession | null {
  const [session, setSession] = useState(getActiveClassroomSession);

  useEffect(() => {
    subscribers.add(setSession);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      activeSession = loadSession();
      notifySubscribers();
    };

    window.addEventListener("storage", handleStorage);
    scheduleExpiry();

    return () => {
      subscribers.delete(setSession);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return session;
}
