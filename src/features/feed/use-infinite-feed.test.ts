import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { createFeedTestContext, createRawPost } from "./feed-test-utils";
import { useInfiniteFeed } from "./use-infinite-feed";

describe("useInfiniteFeed", () => {
  let context: ReturnType<typeof createFeedTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createFeedTestContext();
  });

  afterEach(() => { context.queryClient.clear(); vi.restoreAllMocks(); });

  it("fetches public posts when not authenticated", async () => {
    context.store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce([]);
    const wrapper = context.wrapper;
    const { result } = renderHook(() => useInfiniteFeed(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "/api/posts?page=1&limit=10", token: undefined,
    }));
    expect(result.current.posts).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("fetches first page of posts and normalizes correctly", async () => {
    context.store.dispatch(setSession({ token: "token-1", sessionId: "session-1" }));
    const rawData = { posts: [createRawPost("p-1", "First post"), createRawPost("p-2", "Second post")] };
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(rawData);

    const wrapper = context.wrapper;
    const { result } = renderHook(() => useInfiniteFeed(), { wrapper });

    await waitFor(() => expect(result.current.posts).toHaveLength(2));
    expect(result.current.posts[0].id).toBe("p-1");
    expect(result.current.posts[0].caption).toBe("First post");
    expect(result.current.posts[0].author.username).toBe("userone");
    expect(result.current.posts[0].isLiked).toBe(true);
    expect(result.current.posts[0].likesCount).toBe(3);
    expect(result.current.posts[0].commentsCount).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
    expect(apiSpy).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "/api/posts?page=1&limit=10", token: "token-1" }),
    );
  });

  it("fetches next page and appends posts", async () => {
    context.store.dispatch(setSession({ token: "token-1", sessionId: "session-1" }));
    const page1 = Array.from({ length: 10 }, (_, i) => createRawPost(`p-${i + 1}`));
    const page2 = [createRawPost("p-11"), createRawPost("p-12")];

    const fetchApi = vi.spyOn(apiFetchModule, "apiFetch")
      .mockResolvedValueOnce({ data: page1 })
      .mockResolvedValueOnce({ data: page2 });

    const wrapper = context.wrapper;
    const { result } = renderHook(() => useInfiniteFeed(), { wrapper });

    await waitFor(() => expect(result.current.posts).toHaveLength(10));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.posts).toHaveLength(12));
    expect(result.current.hasNextPage).toBe(false);
    expect(fetchApi).toHaveBeenNthCalledWith(2, expect.objectContaining({
      endpoint: "/api/posts?page=2&limit=10", token: "token-1",
    }));
  });

  it("de-duplicates duplicate post IDs across multiple pages", async () => {
    context.store.dispatch(setSession({ token: "token-1", sessionId: "session-1" }));
    const page1 = Array.from({ length: 10 }, (_, i) => createRawPost(`p-${i + 1}`));
    const page2 = [createRawPost("p-10"), createRawPost("p-11")];

    vi.spyOn(apiFetchModule, "apiFetch")
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const wrapper = context.wrapper;
    const { result } = renderHook(() => useInfiniteFeed(), { wrapper });

    await waitFor(() => expect(result.current.posts).toHaveLength(10));
    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.posts).toHaveLength(11));
    const ids = result.current.posts.map((p) => p.id);
    expect(ids.filter((id) => id === "p-10")).toHaveLength(1);
  });

  it("handles API error response correctly", async () => {
    context.store.dispatch(setSession({ token: "token-1", sessionId: "session-1" }));
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Feed fetch failed"));

    const wrapper = context.wrapper;
    const { result } = renderHook(() => useInfiniteFeed(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Feed fetch failed");
    expect(result.current.posts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
