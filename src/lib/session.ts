// session.ts

const TOKEN_KEY = "token";
const DISPLAY_NAME_KEY = "me_display_name";
const USERNAME_KEY = "me_username";
const AVATAR_KEY = "me_avatar";
export const SESSION_CHANGE_EVENT = "sociality-session-change";

type SessionUser = {
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
};

export type SessionSnapshot = {
  token: string | null;
  isLoggedIn: boolean;
  displayName: string;
  avatarUrl: string | null;
  username: string | null;
};

function hasWindow() {
  return typeof window !== "undefined";
}

function emitSessionChange() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function getToken() {
  if (!hasWindow()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (!hasWindow()) return;
  localStorage.setItem(TOKEN_KEY, token);
  emitSessionChange();
}

export function clearSession() {
  if (!hasWindow()) return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DISPLAY_NAME_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(AVATAR_KEY);
  emitSessionChange();
}

export function persistUserSnapshot(user: SessionUser) {
  if (!hasWindow()) return;

  if (user.username) {
    localStorage.setItem(USERNAME_KEY, user.username);
  }

  if (user.name || user.username) {
    localStorage.setItem(
      DISPLAY_NAME_KEY,
      user.name || user.username || "User",
    );
  }

  if (user.avatarUrl) {
    localStorage.setItem(AVATAR_KEY, user.avatarUrl);
  }

  emitSessionChange();
}

export function getStoredDisplayName() {
  if (!hasWindow()) return "John Doe";
  return (
    localStorage.getItem(DISPLAY_NAME_KEY) ||
    localStorage.getItem(USERNAME_KEY) ||
    "John Doe"
  );
}

export function getStoredAvatar() {
  if (!hasWindow()) return null;
  return localStorage.getItem(AVATAR_KEY);
}

export function getStoredUsername() {
  if (!hasWindow()) return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function readSessionSnapshot(): SessionSnapshot {
  const token = getToken();
  return {
    token,
    isLoggedIn: !!token,
    displayName: getStoredDisplayName(),
    avatarUrl: getStoredAvatar(),
    username: getStoredUsername(),
  };
}

export function buildLoginHref(nextPath?: string) {
  if (!nextPath) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(nextPath)}`;
}
