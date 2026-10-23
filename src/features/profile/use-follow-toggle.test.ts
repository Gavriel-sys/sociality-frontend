import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";
import { makeStore, type AppStore } from "@/lib/store/store";
import { clearSession, setSession } from "../auth/auth-slice";
import { useFollowToggle } from "./use-follow-toggle";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/profile/alex",
}));

function createWrapper(store: AppStore, queryClient: QueryClient) {
  return function TestWrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

describe("useFollowToggle", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    store.dispatch(setSession({ token: "auth-token-123", sessionId: "sess-1", user: { username: "currentuser" } }));
  });

  it("performs optimistic follow and calls POST /api/follow/{username}", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(
      () => useFollowToggle({ username: "alex", isFollowing: false, followersCount: 10 }),
      { wrapper },
    );
    expect(result.current.isFollowing).toBe(false);

    await act(async () => { await result.current.toggleFollow(); });
    expect(apiSpy).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "/api/follow/alex", method: "POST", token: "auth-token-123" }),
    );
    expect(result.current.isFollowing).toBe(true);
    expect(result.current.followersCount).toBe(11);
  });

  it("performs optimistic unfollow and calls DELETE /api/follow/{username}", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(
      () => useFollowToggle({ username: "alex", isFollowing: true, followersCount: 10 }),
      { wrapper },
    );

    await act(async () => { await result.current.toggleFollow(); });
    expect(apiSpy).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "/api/follow/alex", method: "DELETE", token: "auth-token-123" }),
    );
    expect(result.current.isFollowing).toBe(false);
    expect(result.current.followersCount).toBe(9);
  });

  it("rolls back optimistic updates when network call fails", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Network failure"));
    queryClient.setQueryData(queryKeys.public.userProfile("alex"), {
      id: "u-alex", name: "Alex", username: "alex", postsCount: 1, followersCount: 5, followingCount: 2, isFollowing: false,
    });
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(
      () => useFollowToggle({ username: "alex", isFollowing: false, followersCount: 5 }),
      { wrapper },
    );

    await act(async () => { await result.current.toggleFollow(); });
    expect(result.current.isFollowing).toBe(false);
    expect(result.current.followersCount).toBe(5);
  });

  it("redirects unauthenticated users to login with returnTo", async () => {
    store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(
      () => useFollowToggle({ username: "alex", isFollowing: false, followersCount: 10 }),
      { wrapper },
    );

    await act(async () => { await result.current.toggleFollow(); });
    expect(mockPush).toHaveBeenCalledWith("/login?returnTo=%2Fprofile%2Falex");
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("no-ops when user attempts to follow themselves", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(
      () => useFollowToggle({ username: "currentuser", isFollowing: false, followersCount: 10 }),
      { wrapper },
    );

    await act(async () => { await result.current.toggleFollow(); });
    expect(apiSpy).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("prevents duplicate requests when mutation is in-flight", async () => {
    let resolveMutation: (val: unknown) => void = () => {};
    const pendingPromise = new Promise((resolve) => { resolveMutation = resolve; });
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockReturnValue(pendingPromise as Promise<unknown>);
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(
      () => useFollowToggle({ username: "alex", isFollowing: false, followersCount: 10 }),
      { wrapper },
    );

    act(() => { void result.current.toggleFollow(); });
    expect(result.current.isLoading).toBe(true);
    act(() => { void result.current.toggleFollow(); });

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      resolveMutation({ ok: true });
      await pendingPromise;
    });
    expect(result.current.isLoading).toBe(false);
  });
});
