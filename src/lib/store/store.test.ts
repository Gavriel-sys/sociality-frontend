import { describe, expect, it } from "vitest";
import { makeStore } from "./store";
import {
  closeNavigation,
  setNavigationOpen,
  toggleNavigation,
} from "./ui-slice";

describe("Redux store infrastructure", () => {
  it("creates isolated store instances that do not leak state", () => {
    // Arrange
    const storeA = makeStore();
    const storeB = makeStore();

    // Act
    storeA.dispatch(toggleNavigation());

    // Assert
    expect(storeA.getState().ui.isNavigationOpen).toBe(true);
    expect(storeB.getState().ui.isNavigationOpen).toBe(false);
  });

  it("handles navigation UI state actions predictably", () => {
    // Arrange
    const store = makeStore();
    expect(store.getState().ui.isNavigationOpen).toBe(false);

    // Act & Assert toggle
    store.dispatch(toggleNavigation());
    expect(store.getState().ui.isNavigationOpen).toBe(true);

    // Act & Assert set explicit
    store.dispatch(setNavigationOpen(false));
    expect(store.getState().ui.isNavigationOpen).toBe(false);

    // Act & Assert close
    store.dispatch(setNavigationOpen(true));
    store.dispatch(closeNavigation());
    expect(store.getState().ui.isNavigationOpen).toBe(false);
  });
});
