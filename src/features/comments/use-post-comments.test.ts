import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { findPostInCache } from "@/features/posts/post-cache-utils";
import type { Post } from "@/features/posts/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { postCommentsQueryKey } from "./types";
import { useAddComment } from "./use-add-comment";
import { usePostComments } from "./use-post-comments";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/posts/101",
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
  id: "101",
  caption: "Post caption",
  imageUrl: "https://example.com/img.jpg",
  createdAt: "2026-10-24T10:00:00Z",
  author: { id: "author-1", name: "Author", username: "author" },
  likesCount: 10,
  commentsCount: 2,
  isLiked: false,
  isSaved: false,
};

describe("usePostComments & useAddComment", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    store.dispatch(setSession({ token: "token-abc", sessionId: "sess-1", user: { id: "u-99", username: "tester" } }));
    queryClient.setQueryData(["public", "post", "101"], initialPost);
  });

  it("fetches and normalizes comments for a valid postId", async () => {
    const rawComments = [{ id: "c-1", content: "Great!", createdAt: "2026-10-24T11:00:00Z", author: { id: "1", name: "Bob", username: "bob" } }];
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(rawComments);

    const { result } = renderHook(() => usePostComments("101"), { wrapper: createWrapper(store, queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0]?.content).toBe("Great!");
  });

  it("guards against empty postId and returns empty list without fetching", () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => usePostComments(""), { wrapper: createWrapper(store, queryClient) });

    expect(result.current.comments).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error state gracefully", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Network failure"));
    const { result } = renderHook(() => usePostComments("101"), { wrapper: createWrapper(store, queryClient) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network failure");
    expect(result.current.comments).toEqual([]);
  });

  it("redirects unauthenticated users to login on addComment without firing API", async () => {
    store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => useAddComment("101"), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.addComment("New comment");
    });

    expect(mockPush).toHaveBeenCalledWith("/login?returnTo=%2Fposts%2F101");
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("optimistically adds comment, increments post commentsCount, and rolls back on failure", async () => {
    const key = postCommentsQueryKey("101");
    queryClient.setQueryData(key, [{ id: "c-0", content: "Existing", createdAt: "2026-10-24T09:00:00Z", author: { id: "1", name: "A", username: "a" } }]);

    let rejectPromise!: (err: Error) => void;
    vi.spyOn(apiFetchModule, "apiFetch").mockImplementationOnce(() => new Promise((_, rej) => { rejectPromise = rej; }));

    const { result } = renderHook(() => useAddComment("101"), { wrapper: createWrapper(store, queryClient) });

    let addPromise!: Promise<unknown>;
    act(() => {
      addPromise = result.current.addComment("Optimistic text");
      addPromise.catch(() => {});
    });

    await waitFor(() => expect(queryClient.getQueryData<readonly unknown[]>(key)).toHaveLength(2));
    const cached = queryClient.getQueryData<readonly unknown[]>(key);
    expect((cached?.[1] as { content: string }).content).toBe("Optimistic text");
    expect(findPostInCache(queryClient, "101")?.commentsCount).toBe(3);

    await act(async () => {
      rejectPromise(new Error("Server error"));
      try { await addPromise; } catch { /* expected rollback */ }
    });

    await waitFor(() => expect(queryClient.getQueryData<readonly unknown[]>(key)).toHaveLength(1));
    expect(findPostInCache(queryClient, "101")?.commentsCount).toBe(2);
  });
});
