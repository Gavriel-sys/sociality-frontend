import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import {
  normalizePostList,
  usePublicProfile,
  useUserLikes,
  useUserPosts,
} from "./public-profile";
import { normalizePublicUserProfile } from "./types";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function QueryWrapper({ children }: { readonly children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("normalizePublicUserProfile", () => {
  it("normalizes direct, envelope, and boolean following variants", () => {
    const rawDirect = {
      id: "u1",
      name: "Alice Doe",
      username: "alice",
      isFollowing: true,
      postsCount: 5,
      followersCount: 10,
      followingCount: 2,
    };
    expect(normalizePublicUserProfile(rawDirect)).toEqual({
      id: "u1",
      name: "Alice Doe",
      username: "alice",
      email: undefined,
      phone: undefined,
      bio: undefined,
      avatarUrl: undefined,
      postsCount: 5,
      followersCount: 10,
      followingCount: 2,
      isFollowing: true,
    });

    const rawEnvelope = {
      data: {
        id: "u2",
        name: "Bob",
        username: "bob",
        following: "true",
        _count: { posts: 12, followers: 34, following: 56 },
      },
    };
    const normalizedEnvelope = normalizePublicUserProfile(rawEnvelope);
    expect(normalizedEnvelope.isFollowing).toBe(true);
    expect(normalizedEnvelope.postsCount).toBe(12);

    expect(normalizePublicUserProfile({ user: { id: "u3", is_following: 1 } }).isFollowing).toBe(true);
    expect(normalizePublicUserProfile({ id: "u4", isFollowing: false }).isFollowing).toBe(false);
  });
});

describe("normalizePostList", () => {
  it("decodes array, posts, likes, and data envelopes", () => {
    const item = { id: "p1", caption: "Hello", imageUrl: "https://img.jpg" };
    expect(normalizePostList([item])).toHaveLength(1);
    expect(normalizePostList({ posts: [item] })).toHaveLength(1);
    expect(normalizePostList({ likes: [item] })).toHaveLength(1);
    expect(normalizePostList({ data: { posts: [item] } })).toHaveLength(1);
    expect(normalizePostList(null)).toEqual([]);
  });
});

describe("public profile hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usePublicProfile fetches and returns profile when username provided", async () => {
    const spy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({
      id: "u10",
      username: "charlie",
      name: "Charlie",
      isFollowing: false,
    });

    const { result } = renderHook(() => usePublicProfile("charlie"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile?.username).toBe("charlie");
    expect(result.current.profile?.isFollowing).toBe(false);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "/api/users/charlie" }),
    );
  });

  it("usePublicProfile stays disabled on empty username", () => {
    const spy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => usePublicProfile("   "), {
      wrapper: createWrapper(),
    });
    expect(result.current.profile).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("useUserPosts fetches and returns user posts", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce([
      { id: "post-1", caption: "Post 1", imageUrl: "https://img.com/1.png" },
    ]);

    const { result } = renderHook(() => useUserPosts("charlie"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0].caption).toBe("Post 1");
  });

  it("useUserLikes fetches and returns user likes", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({
      likes: [{ id: "liked-1", caption: "Liked 1", imageUrl: "https://img.com/2.png" }],
    });

    const { result } = renderHook(() => useUserLikes("charlie"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.likedPosts).toHaveLength(1);
    expect(result.current.likedPosts[0].caption).toBe("Liked 1");
  });
});
