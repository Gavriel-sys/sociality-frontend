import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { createFeedTestContext, createRawPost } from "./feed-test-utils";
import { useInfiniteFeed } from "./use-infinite-feed";

describe("public feed authentication", () => {
  let context: ReturnType<typeof createFeedTestContext>;
  const fetchPosts = vi.fn<typeof fetch>();

  beforeEach(() => {
    context = createFeedTestContext();
    fetchPosts.mockReset();
    vi.stubGlobal("fetch", fetchPosts);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://sociality.example.com");
  });

  afterEach(() => {
    context.queryClient.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends a Bearer token and preserves the active user's like status", async () => {
    context.store.dispatch(setSession({ token: "signed-in-token", sessionId: "session-1" }));
    fetchPosts.mockResolvedValueOnce(Response.json({ data: { posts: [createRawPost("p-1")] } }));

    const { result } = renderHook(() => useInfiniteFeed(), { wrapper: context.wrapper });

    await waitFor(() => expect(result.current.posts[0]?.isLiked).toBe(true));
    expect(fetchPosts).toHaveBeenCalledExactlyOnceWith(
      "https://sociality.example.com/api/posts?page=1&limit=10", expect.objectContaining({ method: "GET" }),
    );
    expect(new Headers(fetchPosts.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer signed-in-token");
  });

  it("fetches public posts without an Authorization header for guests", async () => {
    context.store.dispatch(clearSession());
    fetchPosts.mockResolvedValueOnce(Response.json({ posts: [{ ...createRawPost("public-post"), likedByMe: false }] }));

    const { result } = renderHook(() => useInfiniteFeed(), { wrapper: context.wrapper });

    await waitFor(() => expect(result.current.posts[0]?.id).toBe("public-post"));
    expect(result.current.posts[0].isLiked).toBe(false);
    expect(new Headers(fetchPosts.mock.calls[0][1]?.headers).has("Authorization")).toBe(false);
  });

  it("does not reuse another session's liked post state", async () => {
    context.store.dispatch(setSession({ token: "first-user-token", sessionId: "first-session" }));
    fetchPosts.mockResolvedValueOnce(Response.json([createRawPost("shared-post")]));
    const { result } = renderHook(() => useInfiniteFeed(), { wrapper: context.wrapper });
    await waitFor(() => expect(result.current.posts[0]?.isLiked).toBe(true));

    fetchPosts.mockResolvedValueOnce(Response.json([{ ...createRawPost("shared-post"), likedByMe: false }]));
    act(() => context.store.dispatch(setSession({ token: "second-user-token", sessionId: "second-session" })));

    await waitFor(() => expect(result.current.posts[0]?.isLiked).toBe(false));
    expect(new Headers(fetchPosts.mock.calls[1][1]?.headers).get("Authorization")).toBe("Bearer second-user-token");
  });
});
