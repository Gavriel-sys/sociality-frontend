"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { normalizePost, type Post } from "@/features/posts/types";
import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";
import { useAppSelector } from "@/lib/store/hooks";

const FEED_PAGE_LIMIT = 10;

export interface UseInfiniteFeedResult {
  readonly posts: readonly Post[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | undefined;
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

function parseFeedPage(raw: unknown): readonly Post[] {
  return extractRawPosts(raw).map(normalizePost);
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

export function useInfiniteFeed(): UseInfiniteFeedResult {
  const { token, sessionId } = useAppSelector((state) => state.auth);

  const queryKey = sessionId
    ? queryKeys.private(sessionId).feed()
    : (["public", "feed"] as const);

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
      const raw = await apiFetch<unknown>({
        endpoint: `/api/posts?page=${pageParam}&limit=${FEED_PAGE_LIMIT}`,
        token: token ?? undefined,
        signal,
      });
      return parseFeedPage(raw);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < FEED_PAGE_LIMIT) {
        return undefined;
      }
      return allPages.length + 1;
    },
  });

  const posts = useMemo(() => deduplicatePosts(data?.pages), [data?.pages]);

  return {
    posts,
    isLoading,
    isError,
    error: error ?? undefined,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}
