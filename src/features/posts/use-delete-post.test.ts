import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import type { Post } from "./types";
import { useDeletePost } from "./use-delete-post";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/feed",
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

const mockPost: Post = {
  id: "post-to-delete",
  caption: "Will be deleted",
  imageUrl: "https://example.com/p.jpg",
  createdAt: "2026-10-25T12:00:00Z",
  author: { id: "u-1", name: "Author", username: "author" },
  likesCount: 3,
  commentsCount: 1,
  isLiked: false,
  isSaved: false,
};

describe("useDeletePost", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    store.dispatch(setSession({ token: "token-del", sessionId: "sess-del", user: { username: "author" } }));
  });

  it("calls DELETE /api/posts/{id} and removes post optimistically", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const feedKey = ["private", "sess-del", "feed"] as const;
    queryClient.setQueryData(feedKey, { pages: [[mockPost]], pageParams: [1] });

    const { result } = renderHook(() => useDeletePost("post-to-delete"), { wrapper: createWrapper(store, queryClient) });
    let success = false;
    await act(async () => {
      success = await result.current.deletePost();
    });

    expect(success).toBe(true);
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "/api/posts/post-to-delete",
      method: "DELETE",
      token: "token-del",
    }));
    const cached = queryClient.getQueryData<{ pages: Post[][] }>(feedKey);
    expect(cached?.pages[0]).toHaveLength(0);
  });

  it("rolls back cache on network failure", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Failed delete"));
    const feedKey = ["private", "sess-del", "feed"] as const;
    queryClient.setQueryData(feedKey, { pages: [[mockPost]], pageParams: [1] });

    const { result } = renderHook(() => useDeletePost("post-to-delete"), { wrapper: createWrapper(store, queryClient) });
    let success = true;
    await act(async () => {
      success = await result.current.deletePost();
    });

    expect(success).toBe(false);
    const cached = queryClient.getQueryData<{ pages: Post[][] }>(feedKey);
    expect(cached?.pages[0]).toHaveLength(1);
    expect(cached?.pages[0][0].id).toBe("post-to-delete");
  });

  it("redirects unauthenticated users to login without calling API", async () => {
    store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => useDeletePost("post-to-delete"), { wrapper: createWrapper(store, queryClient) });

    let success = true;
    await act(async () => {
      success = await result.current.deletePost();
    });

    expect(success).toBe(false);
    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("prevents duplicate concurrent deletions via in-flight guard", async () => {
    let resolver: (v: unknown) => void = () => {};
    const pendingPromise = new Promise((res) => { resolver = res; });
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockReturnValueOnce(pendingPromise as Promise<unknown>);

    const { result } = renderHook(() => useDeletePost("post-to-delete"), { wrapper: createWrapper(store, queryClient) });
    const firstCall = act(async () => { await result.current.deletePost(); });
    const secondCall = act(async () => { const s = await result.current.deletePost(); expect(s).toBe(false); });

    resolver({ ok: true });
    await Promise.all([firstCall, secondCall]);
    expect(apiSpy).toHaveBeenCalledTimes(1);
  });

  it("invalidates post queries on settlement", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeletePost("post-to-delete"), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.deletePost();
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });
});
