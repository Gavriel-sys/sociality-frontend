import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { saveSession } from "./session-storage";
import type { AuthState, AuthUser, SessionData } from "./types";

const initialState: AuthState = {
  token: null,
  sessionId: null,
  user: null,
  status: "idle",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SessionData>) {
      state.token = action.payload.token;
      state.sessionId = action.payload.sessionId;
      state.user = action.payload.user ?? null;
      state.status = "authenticated";
    },
    clearSession(state) {
      state.token = null;
      state.sessionId = null;
      state.user = null;
      state.status = "unauthenticated";
    },
    updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
      state.user = { ...state.user, ...action.payload };
      if (state.token && state.sessionId) {
        saveSession({
          token: state.token,
          sessionId: state.sessionId,
          user: state.user,
        });
      }
    },
  },
});

export const { setSession, clearSession, updateUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
