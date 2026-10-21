import { describe, expect, it } from "vitest";
import { makeStore } from "@/lib/store/store";
import { authReducer, clearSession, setSession } from "./auth-slice";
import type { AuthState, SessionData } from "./types";

const mockSession: SessionData = {
  token: "jwt-test-token-abcdef",
  sessionId: "session-uuid-12345",
  user: {
    id: "user-42",
    name: "Alex Developer",
    username: "alexdev",
    email: "alex@example.com",
  },
};

describe("authSlice", () => {
  it("returns initial auth state on undefined input", () => {
    // Arrange & Act
    const state = authReducer(undefined, { type: "@@INIT" });

    // Assert
    expect(state).toEqual<AuthState>({
      token: null,
      sessionId: null,
      user: null,
      status: "idle",
    });
  });

  it("updates state and sets status to authenticated on setSession", () => {
    // Arrange
    const initialState = authReducer(undefined, { type: "@@INIT" });

    // Act
    const nextState = authReducer(initialState, setSession(mockSession));

    // Assert
    expect(nextState.token).toBe(mockSession.token);
    expect(nextState.sessionId).toBe(mockSession.sessionId);
    expect(nextState.user).toEqual(mockSession.user);
    expect(nextState.status).toBe("authenticated");
  });

  it("sets user to null when payload user is omitted on setSession", () => {
    // Arrange
    const initialState = authReducer(undefined, { type: "@@INIT" });
    const sessionWithoutUser: SessionData = {
      token: "jwt-token-no-user",
      sessionId: "session-no-user",
    };

    // Act
    const nextState = authReducer(initialState, setSession(sessionWithoutUser));

    // Assert
    expect(nextState.user).toBeNull();
    expect(nextState.status).toBe("authenticated");
  });

  it("resets state and transitions status to unauthenticated on clearSession", () => {
    // Arrange
    const authenticatedState = authReducer(undefined, setSession(mockSession));
    expect(authenticatedState.status).toBe("authenticated");

    // Act
    const clearedState = authReducer(authenticatedState, clearSession());

    // Assert
    expect(clearedState.token).toBeNull();
    expect(clearedState.sessionId).toBeNull();
    expect(clearedState.user).toBeNull();
    expect(clearedState.status).toBe("unauthenticated");
  });

  it("maintains pure functional state transitions without mutation leakage", () => {
    // Arrange
    const stateA = authReducer(undefined, setSession(mockSession));
    const stateB = authReducer(
      stateA,
      setSession({ token: "other-token", sessionId: "other-session" }),
    );

    // Assert
    expect(stateA.token).toBe(mockSession.token);
    expect(stateB.token).toBe("other-token");
    expect(stateA).not.toBe(stateB);
  });

  it("integrates into makeStore with isolated auth state across instances", () => {
    // Arrange
    const storeA = makeStore();
    const storeB = makeStore();

    // Act
    storeA.dispatch(setSession(mockSession));

    // Assert
    expect(storeA.getState().auth.status).toBe("authenticated");
    expect(storeA.getState().auth.token).toBe(mockSession.token);
    expect(storeB.getState().auth.status).toBe("idle");
    expect(storeB.getState().auth.token).toBeNull();
  });
});
