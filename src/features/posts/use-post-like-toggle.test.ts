import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import type { Post } from "@/features/posts/types";
import { usePostLikeToggle } from "@/features/posts/use-post-like-toggle";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";

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

const initialPost: Post = {
  id: "post-101",
  caption: "Sample post",
  imageUrl: "https://example.com/p.jpg",
  createdAt: "2026-10-24T12:00:00Z",
  author: { id: "u-1", name: "User", username: "user" },
  likesCount: 5,
  commentsCount: 2,
  isLiked: false,
  isSaved: false,
};

describe("usePostLikeToggle", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    store.dispatch(setSession({ token: "token-abc", sessionId: "sess-1", user: { username: "tester" } }));
  });

  it("performs optimistic like, increments count, and calls POST", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostLikeToggle(initialPost), { wrapper });

    expect(result.current.isLiked).toBe(false);
    expect(result.current.likesCount).toBe(5);

    await act(async () => { await result.current.toggleLike(); });
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/post-101/like", method: "POST", token: "token-abc" }));
    expect(result.current.isLiked).toBe(true);
    expect(result.current.likesCount).toBe(6);
  });

  it("performs optimistic unlike, decrements count, and calls DELETE", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostLikeToggle({ ...initialPost, isLiked: true, likesCount: 6 }), { wrapper });

    await act(async () => { await result.current.toggleLike(); });
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/post-101/like", method: "DELETE", token: "token-abc" }));
    expect(result.current.isLiked).toBe(false);
    expect(result.current.likesCount).toBe(5);
  });

  it("updates post inside cached feed queries optimistically", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const feedKey = ["private", "sess-1", "feed", {}] as const;
    queryClient.setQueryData(feedKey, { pages: [[initialPost]], pageParams: [1] });

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostLikeToggle(initialPost), { wrapper });

    await act(async () => { await result.current.toggleLike(); });
    const cached = queryClient.getQueryData<{ pages: Post[][] }>(feedKey);
    expect(cached?.pages[0][0].isLiked).toBe(true);
    expect(cached?.pages[0][0].likesCount).toBe(6);
  });

  it("rolls back optimistic like and count on network failure", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Network failure"));
    const feedKey = ["private", "sess-1", "feed", {}] as const;
    queryClient.setQueryData(feedKey, { pages: [[initialPost]], pageParams: [1] });

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostLikeToggle(initialPost), { wrapper });

    await act(async () => { await result.current.toggleLike(); });
    expect(result.current.isLiked).toBe(false);
    expect(result.current.likesCount).toBe(5);

    const cached = queryClient.getQueryData<{ pages: Post[][] }>(feedKey);
    expect(cached?.pages[0][0].isLiked).toBe(false);
    expect(cached?.pages[0][0].likesCount).toBe(5);
  });

  it("redirects unauthenticated guests to login and skips API call", async () => {
    store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostLikeToggle(initialPost), { wrapper });

    await act(async () => { await result.current.toggleLike(); });
    expect(mockPush).toHaveBeenCalledWith("/login?returnTo=%2Ffeed");
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("prevents duplicate concurrent calls while mutation is in flight", async () => {
    let resolver: (v: unknown) => void = () => {};
    const pending = new Promise((resolve) => { resolver = resolve; });
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockReturnValue(pending as Promise<unknown>);
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostLikeToggle(initialPost), { wrapper });

    act(() => { void result.current.toggleLike(); });
    expect(result.current.isLoading).toBe(true);
    act(() => { void result.current.toggleLike(); });

    await waitFor(() => expect(apiSpy).toHaveBeenCalledTimes(1));
    await act(async () => { resolver({ ok: true }); await pending; });
    expect(result.current.isLoading).toBe(false);
  });
});
