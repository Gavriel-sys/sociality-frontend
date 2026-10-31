import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMyPostCollection } from "./my-post-collections";

const backendPost = {
  id: 42, caption: "Existing gallery post", imageUrl: "/gallery.jpg", createdAt: "2026-10-31T10:00:00Z",
  author: { id: 1, name: "Alex", username: "alex", avatarUrl: "/avatar.jpg" },
  likeCount: 3, commentCount: 2, likedByMe: true,
};

function itemsResponse(items: readonly unknown[], pagination = { page: 1, total: items.length, totalPages: 1 }): Response {
  return new Response(JSON.stringify({
    success: true, message: "Posts retrieved", data: {
      items, pagination: { limit: 10, ...pagination },
    },
  }), { headers: { "Content-Type": "application/json" } });
}

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com"));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("my posts backend response", () => {
  it("reads existing posts from data.items with the current account's authorization", async () => {
    const fetchRequest = vi.fn<typeof fetch>().mockResolvedValue(itemsResponse([
      backendPost, { ...backendPost, id: 43, caption: "Another existing post" },
    ]));
    vi.stubGlobal("fetch", fetchRequest);
    const signal = new AbortController().signal;

    const posts = await fetchMyPostCollection({ collection: "posts", token: "test-jwt", signal });

    expect(posts.map((post) => post.id)).toEqual([42, 43]);
    expect(posts[0]).toMatchObject({ imageUrl: "/gallery.jpg", likesCount: 3, commentsCount: 2, isLiked: true });
    const [endpoint, options] = fetchRequest.mock.calls[0];
    expect(endpoint).toBe("https://api.example.com/api/me/posts?page=1&limit=10");
    expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer test-jwt");
    expect(options?.signal).toBe(signal);
  });

  it("keeps posts from each data.items page", async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) => ({ ...backendPost, id: index + 1 }));
    const fetchRequest = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(itemsResponse(firstPage, { page: 1, total: 11, totalPages: 2 }))
      .mockResolvedValueOnce(itemsResponse([{ ...backendPost, id: 11 }], { page: 2, total: 11, totalPages: 2 }));
    vi.stubGlobal("fetch", fetchRequest);

    const posts = await fetchMyPostCollection({ collection: "posts", signal: new AbortController().signal });

    expect(posts.map((post) => post.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(fetchRequest).toHaveBeenCalledTimes(2);
  });

  it("keeps an empty data.items array empty", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(itemsResponse([])));

    const posts = await fetchMyPostCollection({ collection: "posts", signal: new AbortController().signal });

    expect(posts).toEqual([]);
  });
});
