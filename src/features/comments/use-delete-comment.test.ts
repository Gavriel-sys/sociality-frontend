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
import { postCommentsQueryKey, type Comment } from "./types";
import { useDeleteComment } from "./use-delete-comment";

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
  id: "101",
  caption: "Test post",
  imageUrl: "https://example.com/test.jpg",
  createdAt: "2026-10-24T10:00:00Z",
  author: { id: "a-1", name: "Author", username: "author" },
  likesCount: 5,
  commentsCount: 2,
  isLiked: false,
  isSaved: false,
};

const mockComments: readonly Comment[] = [
  { id: "c-1", content: "First", createdAt: "2026-10-24T11:00:00Z", author: { id: "u-1", name: "U1", username: "u1" } },
  { id: "c-2", content: "Second", createdAt: "2026-10-24T12:00:00Z", author: { id: "u-2", name: "U2", username: "u2" } },
];

describe("useDeleteComment", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    store.dispatch(setSession({ token: "token-xyz", sessionId: "sess-1", user: { id: "u-1", username: "u1" } }));
    queryClient.setQueryData(["public", "post", "101"], mockPost);
    queryClient.setQueryData(postCommentsQueryKey("101"), mockComments);
  });

  it("optimistically deletes comment, decrements commentsCount, and calls DELETE endpoint", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useDeleteComment("c-1", "101"), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.deleteComment();
    });

    expect(apiSpy).toHaveBeenCalledWith({
      endpoint: "/api/comments/c-1",
      method: "DELETE",
      token: "token-xyz",
    });
    const remaining = queryClient.getQueryData<readonly Comment[]>(postCommentsQueryKey("101"));
    expect(remaining).toHaveLength(1);
    expect(remaining?.[0]?.id).toBe("c-2");
    expect(findPostInCache(queryClient, "101")?.commentsCount).toBe(1);
  });

  it("rolls back comments snapshot and restores count on network failure", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Network failure"));
    const { result } = renderHook(() => useDeleteComment("c-1", "101"), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.deleteComment();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network failure");
    const comments = queryClient.getQueryData<readonly Comment[]>(postCommentsQueryKey("101"));
    expect(comments).toHaveLength(2);
    expect(findPostInCache(queryClient, "101")?.commentsCount).toBe(2);
  });

  it("debounces concurrent in-flight delete calls to prevent duplicates", async () => {
    let resolvePromise!: (val: unknown) => void;
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockImplementationOnce(
      () => new Promise((resolve) => { resolvePromise = resolve; }),
    );
    const { result } = renderHook(() => useDeleteComment("c-1", "101"), { wrapper: createWrapper(store, queryClient) });

    act(() => {
      void result.current.deleteComment();
      void result.current.deleteComment();
    });

    await waitFor(() => expect(apiSpy).toHaveBeenCalledTimes(1));

    await act(async () => {
      resolvePromise({ success: true });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("guards against unauthenticated user and skips delete API call", async () => {
    store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => useDeleteComment("c-1", "101"), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.deleteComment();
    });

    expect(apiSpy).not.toHaveBeenCalled();
    expect(queryClient.getQueryData<readonly Comment[]>(postCommentsQueryKey("101"))).toHaveLength(2);
  });
});
