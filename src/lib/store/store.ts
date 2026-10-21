import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth/auth-slice";
import { uiReducer } from "./ui-slice";

export function makeStore() {
  return configureStore({
    reducer: {
      ui: uiReducer,
      auth: authReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
