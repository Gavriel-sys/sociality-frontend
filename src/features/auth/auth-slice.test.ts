import { beforeEach, describe, expect, it } from "vitest";
import { makeStore } from "@/lib/store/store";
import { authReducer, clearSession, setSession, updateUser } from "./auth-slice";
import { clearSession as clearStorage, loadSession } from "./session-storage";
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
  beforeEach(() => {
    clearStorage();
  });

  it("returns initial auth state on undefined input", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual<AuthState>({
      token: null,
      sessionId: null,
      user: null,
      status: "idle",
    });
  });

  it("updates state and sets status to authenticated on setSession", () => {
    const initialState = authReducer(undefined, { type: "@@INIT" });
    const nextState = authReducer(initialState, setSession(mockSession));

    expect(nextState.token).toBe(mockSession.token);
    expect(nextState.sessionId).toBe(mockSession.sessionId);
    expect(nextState.user).toEqual(mockSession.user);
    expect(nextState.status).toBe("authenticated");
  });

  it("sets user to null when payload user is omitted on setSession", () => {
    const initialState = authReducer(undefined, { type: "@@INIT" });
    const sessionWithoutUser: SessionData = {
      token: "jwt-token-no-user",
      sessionId: "session-no-user",
    };
    const nextState = authReducer(initialState, setSession(sessionWithoutUser));

    expect(nextState.user).toBeNull();
    expect(nextState.status).toBe("authenticated");
  });

  it("resets state and transitions status to unauthenticated on clearSession", () => {
    const authenticatedState = authReducer(undefined, setSession(mockSession));
    const clearedState = authReducer(authenticatedState, clearSession());

    expect(clearedState.token).toBeNull();
    expect(clearedState.sessionId).toBeNull();
    expect(clearedState.user).toBeNull();
    expect(clearedState.status).toBe("unauthenticated");
  });

  it("updates user profile and syncs session storage while preserving token", () => {
    const authenticatedState = authReducer(undefined, setSession(mockSession));
    const updatedState = authReducer(
      authenticatedState,
      updateUser({ name: "Alex Updated", avatarUrl: "https://example.com/avatar.jpg" }),
    );

    expect(updatedState.token).toBe(mockSession.token);
    expect(updatedState.sessionId).toBe(mockSession.sessionId);
    expect(updatedState.status).toBe("authenticated");
    expect(updatedState.user?.name).toBe("Alex Updated");
    expect(updatedState.user?.avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(updatedState.user?.username).toBe("alexdev");

    const persisted = loadSession();
    expect(persisted?.user?.name).toBe("Alex Updated");
    expect(persisted?.user?.avatarUrl).toBe("https://example.com/avatar.jpg");
  });

  it("assigns user when state.user is null on updateUser", () => {
    const initialState = authReducer(undefined, { type: "@@INIT" });
    const updatedState = authReducer(initialState, updateUser({ name: "New User" }));

    expect(updatedState.user?.name).toBe("New User");
    expect(updatedState.token).toBeNull();
  });

  it("maintains pure functional state transitions without mutation leakage", () => {
    const stateA = authReducer(undefined, setSession(mockSession));
    const stateB = authReducer(
      stateA,
      setSession({ token: "other-token", sessionId: "other-session" }),
    );

    expect(stateA.token).toBe(mockSession.token);
    expect(stateB.token).toBe("other-token");
    expect(stateA).not.toBe(stateB);
  });

  it("integrates into makeStore with isolated auth state across instances", () => {
    const storeA = makeStore();
    const storeB = makeStore();

    storeA.dispatch(setSession(mockSession));

    expect(storeA.getState().auth.status).toBe("authenticated");
    expect(storeA.getState().auth.token).toBe(mockSession.token);
    expect(storeB.getState().auth.status).toBe("idle");
    expect(storeB.getState().auth.token).toBeNull();
  });
});
