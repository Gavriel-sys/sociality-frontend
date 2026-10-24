import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import type { Post } from "@/features/posts/types";
import { usePostSaveToggle } from "@/features/posts/use-post-save-toggle";
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
  id: "post-202",
  caption: "Save test post",
  imageUrl: "https://example.com/p2.jpg",
  createdAt: "2026-10-24T12:00:00Z",
  author: { id: "u-2", name: "User Two", username: "user2" },
  likesCount: 10,
  commentsCount: 3,
  isLiked: false,
  isSaved: false,
};

describe("usePostSaveToggle", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    store.dispatch(setSession({ token: "token-save", sessionId: "sess-2", user: { username: "saver" } }));
  });

  it("performs optimistic save and calls POST", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostSaveToggle(initialPost), { wrapper });

    expect(result.current.isSaved).toBe(false);
    await act(async () => { await result.current.toggleSave(); });
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/post-202/save", method: "POST", token: "token-save" }));
    expect(result.current.isSaved).toBe(true);
  });

  it("performs optimistic unsave and calls DELETE", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostSaveToggle({ ...initialPost, isSaved: true }), { wrapper });

    await act(async () => { await result.current.toggleSave(); });
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/post-202/save", method: "DELETE", token: "token-save" }));
    expect(result.current.isSaved).toBe(false);
  });

  it("updates post inside cached feed queries optimistically", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ ok: true });
    const feedKey = ["private", "sess-2", "feed", {}] as const;
    queryClient.setQueryData(feedKey, { pages: [[initialPost]], pageParams: [1] });

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostSaveToggle(initialPost), { wrapper });

    await act(async () => { await result.current.toggleSave(); });
    const cached = queryClient.getQueryData<{ pages: Post[][] }>(feedKey);
    expect(cached?.pages[0][0].isSaved).toBe(true);
  });

  it("rolls back optimistic save on network failure", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Network failure"));
    const feedKey = ["private", "sess-2", "feed", {}] as const;
    queryClient.setQueryData(feedKey, { pages: [[initialPost]], pageParams: [1] });

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostSaveToggle(initialPost), { wrapper });

    await act(async () => { await result.current.toggleSave(); });
    expect(result.current.isSaved).toBe(false);

    const cached = queryClient.getQueryData<{ pages: Post[][] }>(feedKey);
    expect(cached?.pages[0][0].isSaved).toBe(false);
  });

  it("redirects unauthenticated guests to login and skips API call", async () => {
    store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostSaveToggle(initialPost), { wrapper });

    await act(async () => { await result.current.toggleSave(); });
    expect(mockPush).toHaveBeenCalledWith("/login?returnTo=%2Ffeed");
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("prevents duplicate concurrent calls while mutation is in flight", async () => {
    let resolver: (v: unknown) => void = () => {};
    const pending = new Promise((resolve) => { resolver = resolve; });
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockReturnValue(pending as Promise<unknown>);
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => usePostSaveToggle(initialPost), { wrapper });

    act(() => { void result.current.toggleSave(); });
    expect(result.current.isLoading).toBe(true);
    act(() => { void result.current.toggleSave(); });

    await waitFor(() => expect(apiSpy).toHaveBeenCalledTimes(1));
    await act(async () => { resolver({ ok: true }); await pending; });
    expect(result.current.isLoading).toBe(false);
  });
});
