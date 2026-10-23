"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { normalizePost, type Post } from "@/features/posts/types";
import { apiFetch } from "@/lib/api/api-fetch";
import { useAppSelector } from "@/lib/store/hooks";

const EXPLORE_PAGE_LIMIT = 10;

export interface UseInfiniteExploreResult {
  readonly posts: readonly Post[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => Promise<unknown>;
  readonly refetch: () => Promise<unknown>;
}

function extractRawPosts(raw: unknown): readonly unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw === "object" && raw !== null) {
    const candidate = raw as Record<string, unknown>;
    if (Array.isArray(candidate.posts)) {
      return candidate.posts;
    }
    if (Array.isArray(candidate.data)) {
      return candidate.data;
    }
    if (typeof candidate.data === "object" && candidate.data !== null) {
      const nested = candidate.data as Record<string, unknown>;
      if (Array.isArray(nested.posts)) {
        return nested.posts;
      }
    }
  }
  return [];
}

function parseExplorePage(raw: unknown): readonly Post[] {
  const items = extractRawPosts(raw);
  return items.map((item) => normalizePost(item));
}

function deduplicatePosts(
  pages: readonly (readonly Post[])[] | undefined,
): readonly Post[] {
  if (!pages || pages.length === 0) {
    return [];
  }
  const seen = new Map<string | number, Post>();
  for (const page of pages) {
    for (const post of page) {
      if (!seen.has(post.id)) {
        seen.set(post.id, post);
      }
    }
  }
  return Array.from(seen.values());
}

export function useInfiniteExplore(): UseInfiniteExploreResult {
  const { token, sessionId } = useAppSelector((state) => state.auth);

  const queryKey = sessionId
    ? (["private", sessionId, "explore"] as const)
    : (["private", "unauthenticated", "explore"] as const);

  const isEnabled = Boolean(token && sessionId);

  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<readonly Post[], Error>({
    queryKey,
    queryFn: async ({ pageParam = 1, signal }) => {
      if (!token) {
        throw new Error("Missing authentication token.");
      }
      const raw = await apiFetch<unknown>({
        endpoint: `/api/posts?page=${pageParam}&limit=${EXPLORE_PAGE_LIMIT}`,
        token,
        signal,
      });
      return parseExplorePage(raw);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < EXPLORE_PAGE_LIMIT) {
        return undefined;
      }
      return allPages.length + 1;
    },
    enabled: isEnabled,
  });

  const posts = useMemo(() => deduplicatePosts(data?.pages), [data?.pages]);

  return {
    posts,
    isLoading,
    isError,
    error: error ?? null,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}
