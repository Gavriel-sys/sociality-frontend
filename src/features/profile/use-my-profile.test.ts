import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { clearSession, setSession } from "../auth/auth-slice";
import { normalizeUserProfile, type UserProfile } from "./types";
import { useMyProfile } from "./use-my-profile";

const mockProfile: UserProfile = {
  id: "user-123",
  name: "Jane Doe",
  username: "janedoe",
  email: "jane@example.com",
  bio: "Software craftsman & coffee lover",
  avatarUrl: "https://example.com/avatar.png",
  postsCount: 12,
  followersCount: 1420,
  followingCount: 350,
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

describe("normalizeUserProfile", () => {
  it("normalizes standard profile data accurately", () => {
    const result = normalizeUserProfile(mockProfile);
    expect(result).toEqual(mockProfile);
  });

  it("handles nested data and _count fallbacks", () => {
    const raw = {
      data: {
        id: 42,
        name: "Bob",
        username: "bob",
        _count: { posts: 7, followers: 88, following: 19 },
      },
    };
    const result = normalizeUserProfile(raw);
    expect(result.id).toBe(42);
    expect(result.postsCount).toBe(7);
    expect(result.followersCount).toBe(88);
    expect(result.followingCount).toBe(19);
  });

  it("throws ApiDecodeError or Error when input is not an object", () => {
    expect(() => normalizeUserProfile(null)).toThrow();
    expect(() => normalizeUserProfile("invalid")).toThrow();
  });
});

describe("useMyProfile", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("is disabled when user is not authenticated", () => {
    store.dispatch(clearSession());
    const wrapper = createWrapper(store, queryClient);

    const { result } = renderHook(() => useMyProfile(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.profile).toBeUndefined();
  });

  it("fetches and returns profile data when authenticated", async () => {
    store.dispatch(
      setSession({
        token: "valid-token-xyz",
        sessionId: "sess-abc-123",
      }),
    );
    const apiFetchSpy = vi
      .spyOn(apiFetchModule, "apiFetch")
      .mockResolvedValueOnce(mockProfile);

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useMyProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isError).toBe(false);
    expect(apiFetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "/api/me",
        token: "valid-token-xyz",
      }),
    );
  });

  it("handles API error responses correctly", async () => {
    store.dispatch(
      setSession({
        token: "expired-token",
        sessionId: "sess-def-456",
      }),
    );
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(
      new Error("Unauthorized"),
    );

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useMyProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Unauthorized");
    expect(result.current.profile).toBeUndefined();
  });
});
