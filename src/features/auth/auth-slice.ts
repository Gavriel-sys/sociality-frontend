import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, SessionData } from "./types";

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
  },
});

export const { setSession, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
