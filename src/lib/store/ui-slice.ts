import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  readonly isNavigationOpen: boolean;
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
  },
});

export const { toggleNavigation, setNavigationOpen, closeNavigation } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
