import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { setSession } from "../auth/auth-slice";
import { useUserFollowers, useUserFollowing } from "./use-user-network";

function createWrapper(store: AppStore, queryClient: QueryClient) {
  return function TestWrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

const mockRawUsers = [
  { id: "u-1", name: "Alice Smith", username: "alice", avatarUrl: "https://example.com/a.jpg", bio: "Bio A" },
  { id: "u-2", name: "Bob Jones", username: "bobj", avatarUrl: "https://example.com/b.jpg" },
];

describe("useUserNetwork hooks", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    store.dispatch(setSession({ token: "auth-123", sessionId: "sess-1", user: { username: "alice" } }));
  });

  describe("useUserFollowers", () => {
    it("fetches followers and normalizes users", async () => {
      const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(mockRawUsers);
      const wrapper = createWrapper(store, queryClient);
      const { result } = renderHook(() => useUserFollowers("alice"), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiSpy).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: "/api/users/alice/followers", token: "auth-123" }),
      );
      expect(result.current.users).toHaveLength(2);
      expect(result.current.users[0]?.username).toBe("alice");
      expect(result.current.users[1]?.name).toBe("Bob Jones");
    });

    it("handles nested response formats like { users: [...] }", async () => {
      vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ users: mockRawUsers });
      const wrapper = createWrapper(store, queryClient);
      const { result } = renderHook(() => useUserFollowers("alice"), { wrapper });

      await waitFor(() => {
        expect(result.current.users).toHaveLength(2);
      });
    });

    it("returns empty users list without calling API when username is empty", () => {
      const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
      const wrapper = createWrapper(store, queryClient);
      const { result } = renderHook(() => useUserFollowers("   "), { wrapper });

      expect(result.current.users).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(apiSpy).not.toHaveBeenCalled();
    });

    it("handles error when API request fails", async () => {
      vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Network failure"));
      const wrapper = createWrapper(store, queryClient);
      const { result } = renderHook(() => useUserFollowers("alice"), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(result.current.error?.message).toBe("Network failure");
      expect(result.current.users).toEqual([]);
    });
  });

  describe("useUserFollowing", () => {
    it("fetches following and normalizes users", async () => {
      const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(mockRawUsers);
      const wrapper = createWrapper(store, queryClient);
      const { result } = renderHook(() => useUserFollowing("bobj"), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiSpy).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: "/api/users/bobj/following", token: "auth-123" }),
      );
      expect(result.current.users).toHaveLength(2);
    });

    it("handles error when following fetch fails", async () => {
      vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Timeout"));
      const wrapper = createWrapper(store, queryClient);
      const { result } = renderHook(() => useUserFollowing("bobj"), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(result.current.error?.message).toBe("Timeout");
    });
  });
});
