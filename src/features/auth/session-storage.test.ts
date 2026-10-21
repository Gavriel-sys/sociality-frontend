import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_STORAGE_KEY,
  clearSession,
  loadSession,
  saveSession,
} from "./session-storage";
import type { SessionData } from "./types";

const mockSession: SessionData = {
  token: "jwt-test-token-12345",
  sessionId: "session-abc-67890",
  user: {
    id: "user-1",
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
  },
};

describe("sessionStorage wrapper", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves and loads a valid session correctly", () => {
    // Arrange & Act
    saveSession(mockSession);
    const loaded = loadSession();

    // Assert
    expect(loaded).toEqual(mockSession);
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBe(
      JSON.stringify(mockSession),
    );
  });

  it("clears stored session data", () => {
    // Arrange
    saveSession(mockSession);
    expect(loadSession()).not.toBeNull();

    // Act
    clearSession();

    // Assert
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("recovers gracefully and returns null when stored JSON is malformed", () => {
    // Arrange
    window.localStorage.setItem(SESSION_STORAGE_KEY, "{malformed json syntax");

    // Act
    const loaded = loadSession();

    // Assert
    expect(loaded).toBeNull();
  });

  it("returns null when stored object lacks required token or sessionId", () => {
    // Arrange & Act & Assert
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ user: { id: "user-1" } }),
    );
    expect(loadSession()).toBeNull();

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: "", sessionId: "valid-session" }),
    );
    expect(loadSession()).toBeNull();

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: "valid-token", sessionId: "" }),
    );
    expect(loadSession()).toBeNull();
  });

  it("handles storage write exceptions (quota exceeded) without throwing", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError: storage full");
    });

    // Act & Assert
    expect(() => saveSession(mockSession)).not.toThrow();
  });

  it("handles storage read exceptions (security restriction) without throwing", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: access denied");
    });

    // Act & Assert
    expect(loadSession()).toBeNull();
  });

  it("handles storage remove exceptions gracefully", () => {
    // Arrange
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError: access denied");
    });

    // Act & Assert
    expect(() => clearSession()).not.toThrow();
  });

  it("behaves safely when window or localStorage is undefined (SSR environment)", () => {
    // Arrange
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error Simulating server-side execution without window
      delete globalThis.window;

      // Act & Assert
      expect(loadSession()).toBeNull();
      expect(() => saveSession(mockSession)).not.toThrow();
      expect(() => clearSession()).not.toThrow();
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
