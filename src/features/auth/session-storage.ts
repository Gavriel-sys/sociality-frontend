import type { SessionData } from "./types";

export const SESSION_STORAGE_KEY = "sociality_session";

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function isValidSessionData(candidate: unknown): candidate is SessionData {
  if (typeof candidate !== "object" || candidate === null) {
    return false;
  }
  const session = candidate as Record<string, unknown>;
  return (
    typeof session.token === "string" &&
    session.token.trim().length > 0 &&
    typeof session.sessionId === "string" &&
    session.sessionId.trim().length > 0
  );
}

export function saveSession(data: SessionData): void {
  if (!isStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Gracefully handle private browsing restrictions or storage quota errors
  }
}

export function loadSession(): SessionData | null {
  if (!isStorageAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return isValidSessionData(parsed) ? parsed : null;
  } catch {
    // Gracefully recover from corrupt JSON or storage access errors
    return null;
  }
}

export function clearSession(): void {
  if (!isStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Gracefully handle storage removal restrictions
  }
}
