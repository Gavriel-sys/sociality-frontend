import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import type { Post } from "./types";
import { usePostDetail } from "./use-post-detail";

const mockPostResponse = {
  id: "p-42",
  caption: "Hiking through the alpine ridge!",
  imageUrl: "https://example.com/alpine.jpg",
  createdAt: "2026-10-24T12:00:00.000Z",
  author: { id: "u-9", name: "Alpine Hiker", username: "hiker", avatarUrl: "https://example.com/avatar.jpg" },
  likesCount: 15,
  commentsCount: 3,
  isLiked: true,
  isSaved: false,
};

function createWrapper(store: AppStore = makeStore()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

describe("usePostDetail query hook", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("fetches and decodes post detail for a valid postId", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(mockPostResponse as unknown as Post);
    const { result } = renderHook(() => usePostDetail("p-42"), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.post?.id).toBe("p-42");
    expect(result.current.post?.caption).toBe("Hiking through the alpine ridge!");
    expect(result.current.post?.isLiked).toBe(true);
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "/api/posts/p-42",
    }));
  });

  it("attaches auth token when session is present in store", async () => {
    const store = makeStore();
    store.dispatch(setSession({ token: "token-abc", sessionId: "sess-1", user: { username: "tester" } }));
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(mockPostResponse as unknown as Post);

    const { result } = renderHook(() => usePostDetail(42), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "/api/posts/42",
      token: "token-abc",
    }));
  });

  it("does not trigger request when postId is empty or whitespace", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => usePostDetail("   "), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.post).toBeNull();
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("handles fetch errors and exposes error object and supports refetch", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch")
      .mockRejectedValueOnce(new Error("Post not found"))
      .mockResolvedValueOnce(mockPostResponse as unknown as Post);

    const { result } = renderHook(() => usePostDetail("p-missing"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Post not found");
    expect(result.current.post).toBeNull();

    await result.current.refetch();
    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.post?.id).toBe("p-42");
    expect(apiSpy).toHaveBeenCalledTimes(2);
  });
});
