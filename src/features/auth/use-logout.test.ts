import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore, type AppStore } from "@/lib/store/store";
import { setSession } from "./auth-slice";
import * as sessionStorageModule from "./session-storage";
import { useLogout } from "./use-logout";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("useLogout", () => {
  let store: AppStore;
  let queryClient: QueryClient;
  let clearStorageSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    store.dispatch(
      setSession({
        token: "existing-jwt-token",
        sessionId: "sess-abc-123",
        user: { id: 1, username: "existing_user" },
      }),
    );
    queryClient = new QueryClient();
    clearStorageSpy = vi.spyOn(sessionStorageModule, "clearSession").mockImplementation(() => {});
  });

  function createWrapper(customStore: AppStore, customQueryClient: QueryClient) {
    return function TestWrapper({ children }: { readonly children: ReactNode }) {
      const providerElement = createElement(
        Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
        { store: customStore },
        createElement(QueryClientProvider, { client: customQueryClient }, children),
      );
      return providerElement;
    };
  }

  it("coordinates storage, Redux, query cache, and default navigation to /login", () => {
    // Arrange
    const clearQueryCacheSpy = vi.spyOn(queryClient, "clear");
    const wrapper = createWrapper(store, queryClient);

    const { result } = renderHook(() => useLogout(), { wrapper });

    // Pre-condition assertion
    expect(store.getState().auth.status).toBe("authenticated");

    // Act
    result.current();

    // Assert: storage cleared
    expect(clearStorageSpy).toHaveBeenCalledTimes(1);

    // Assert: Redux state cleared to unauthenticated
    expect(store.getState().auth.status).toBe("unauthenticated");
    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.sessionId).toBeNull();
    expect(store.getState().auth.user).toBeNull();

    // Assert: Query cache purged
    expect(clearQueryCacheSpy).toHaveBeenCalledTimes(1);

    // Assert: Navigation to /login
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("supports object-destructured invocation ({ logout })", () => {
    // Arrange
    const clearQueryCacheSpy = vi.spyOn(queryClient, "clear");
    const wrapper = createWrapper(store, queryClient);

    const { result } = renderHook(() => useLogout(), { wrapper });

    // Act
    result.current.logout();

    // Assert
    expect(clearStorageSpy).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.status).toBe("unauthenticated");
    expect(clearQueryCacheSpy).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("navigates to a custom destination when provided", () => {
    // Arrange
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useLogout(), { wrapper });

    // Act
    result.current("/custom-redirect");

    // Assert
    expect(mockPush).toHaveBeenCalledWith("/custom-redirect");
  });
});
