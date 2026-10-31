import { createSlice, nanoid } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  readonly isNavigationOpen: boolean;
  readonly postSuccessNoticeId?: string;
}

const initialState: UiState = {
  isNavigationOpen: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleNavigation: (state) => {
      state.isNavigationOpen = !state.isNavigationOpen;
    },
    setNavigationOpen: (state, action: PayloadAction<boolean>) => {
      state.isNavigationOpen = action.payload;
    },
    closeNavigation: (state) => {
      state.isNavigationOpen = false;
    },
    showPostSuccess: {
      reducer: (state, action: PayloadAction<string>) => {
        state.postSuccessNoticeId = action.payload;
      },
      prepare: () => ({ payload: nanoid() }),
    },
    dismissPostSuccess: (state) => {
      state.postSuccessNoticeId = undefined;
    },
  },
});

export const { toggleNavigation, setNavigationOpen, closeNavigation, showPostSuccess, dismissPostSuccess } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
