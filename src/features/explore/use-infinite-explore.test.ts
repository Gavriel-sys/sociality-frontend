import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { useInfiniteExplore } from "./use-infinite-explore";

function createMockPost(id: string | number, text = "Explore post caption") {
  return {
    id,
    text,
    image: "https://example.com/explore.jpg",
    created_at: "2026-10-23T10:00:00.000Z",
    author: { id: "user-9", name: "Explorer", username: "explorer" },
    likes_count: 8,
    comments_count: 3,
    is_liked: false,
    is_saved: false,
  };
}

function createWrapper(store: AppStore, queryClient: QueryClient) {
  return function TestWrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

describe("useInfiniteExplore", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("is disabled when not authenticated", () => {
    store.dispatch(clearSession());
    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useInfiniteExplore(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.posts).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("fetches first page of posts and normalizes correctly", async () => {
    store.dispatch(setSession({ token: "token-exp", sessionId: "session-exp" }));
    const rawData = { posts: [createMockPost("exp-1", "Post 1"), createMockPost("exp-2", "Post 2")] };
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(rawData);

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useInfiniteExplore(), { wrapper });

    await waitFor(() => expect(result.current.posts).toHaveLength(2));
    expect(result.current.posts[0].id).toBe("exp-1");
    expect(result.current.posts[0].caption).toBe("Post 1");
    expect(result.current.posts[0].author.username).toBe("explorer");
    expect(result.current.hasNextPage).toBe(false);
    expect(apiSpy).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "/api/posts?page=1&limit=10", token: "token-exp" }),
    );
  });

  it("fetches next page and appends posts", async () => {
    store.dispatch(setSession({ token: "token-exp", sessionId: "session-exp" }));
    const page1 = Array.from({ length: 10 }, (_, i) => createMockPost(`exp-${i + 1}`));
    const page2 = [createMockPost("exp-11"), createMockPost("exp-12")];

    vi.spyOn(apiFetchModule, "apiFetch")
      .mockResolvedValueOnce({ data: page1 })
      .mockResolvedValueOnce({ data: page2 });

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useInfiniteExplore(), { wrapper });

    await waitFor(() => expect(result.current.posts).toHaveLength(10));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.posts).toHaveLength(12));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("de-duplicates duplicate post IDs across multiple pages", async () => {
    store.dispatch(setSession({ token: "token-exp", sessionId: "session-exp" }));
    const page1 = Array.from({ length: 10 }, (_, i) => createMockPost(`exp-${i + 1}`));
    const page2 = [createMockPost("exp-10"), createMockPost("exp-11")];

    vi.spyOn(apiFetchModule, "apiFetch")
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useInfiniteExplore(), { wrapper });

    await waitFor(() => expect(result.current.posts).toHaveLength(10));
    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.posts).toHaveLength(11));
    const ids = result.current.posts.map((p) => p.id);
    expect(ids.filter((id) => id === "exp-10")).toHaveLength(1);
  });

  it("handles API error response correctly", async () => {
    store.dispatch(setSession({ token: "token-exp", sessionId: "session-exp" }));
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Explore fetch failed"));

    const wrapper = createWrapper(store, queryClient);
    const { result } = renderHook(() => useInfiniteExplore(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Explore fetch failed");
    expect(result.current.posts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
