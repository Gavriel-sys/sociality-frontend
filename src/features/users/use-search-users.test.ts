import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { setSession } from "../auth/auth-slice";
import type { SearchUser } from "./types";
import { useSearchUsers } from "./use-search-users";

const mockUser: SearchUser = {
  id: "user-1",
  name: "Alice Walker",
  username: "alice",
  avatarUrl: "https://example.com/alice.png",
  bio: "Curator",
};

function createWrapper(store: AppStore, queryClient: QueryClient) {
  return function TestWrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

describe("useSearchUsers", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("empty query returns empty without fetch", () => {
    const fetchSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useSearchUsers("   "), { wrapper });

    expect(result.current.users).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("debounced fetch works after debounce delay", async () => {
    const fetchSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({
      users: [mockUser],
      total: 1,
    });
    const wrapper = createWrapper(store, queryClient);
    const { result, rerender } = renderHook(({ q }) => useSearchUsers(q, 1, 20, 50), {
      initialProps: { q: "" },
      wrapper,
    });

    expect(result.current.users).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();

    rerender({ q: "alice" });
    await waitFor(() => expect(result.current.users).toHaveLength(1));

    expect(result.current.users[0].username).toBe("alice");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "/api/users/search?q=alice&page=1&limit=20" }),
    );
  });

  it("passes pagination params correctly to endpoint", async () => {
    const fetchSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({
      users: [mockUser],
      total: 45,
    });
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useSearchUsers("bob", 3, 15, 0), { wrapper });

    await waitFor(() => expect(result.current.users).toHaveLength(1));
    expect(result.current.total).toBe(45);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "/api/users/search?q=bob&page=3&limit=15" }),
    );
  });

  it("passes auth token when authenticated and omits when logged out", async () => {
    const fetchSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ users: [], total: 0 });
    store.dispatch(setSession({ token: "auth-token-123", sessionId: "sess-1" }));
    const wrapper = createWrapper(store, queryClient);

    renderHook(() => useSearchUsers("findme", 1, 20, 0), { wrapper });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ token: "auth-token-123" }),
      );
    });
  });

  it("handles fetch errors gracefully", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValue(new Error("Server error"));
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useSearchUsers("err", 1, 20, 0), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Server error");
    expect(result.current.users).toEqual([]);
  });
});
