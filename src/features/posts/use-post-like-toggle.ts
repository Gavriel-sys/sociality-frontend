"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { notifyManager, useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { myPostCollectionKey } from "@/features/profile/my-post-collections";
import { apiFetch } from "@/lib/api/api-fetch";
import {
  findPostInCache, invalidatePostQueries, isPostQueryKey,
  restorePostQueries, snapshotPostQueries, updatePostInCache,
} from "./post-cache-utils";
import type { Post } from "./types";
import { normalizePost } from "./types";
import { usePostQueryClient, usePostSession } from "./use-post-context";

export interface UsePostLikeToggleOptions {
  readonly id: string | number;
  readonly isLiked: boolean;
  readonly likesCount: number;
}

export interface UsePostLikeToggleResult {
  readonly toggleLike: () => Promise<void>;
  readonly isLoading: boolean;
  readonly isLiked: boolean;
  readonly likesCount: number;
}

export function usePostLikeToggle(options: Readonly<UsePostLikeToggleOptions>): UsePostLikeToggleResult {
  const queryClient = usePostQueryClient();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { token, sessionId } = usePostSession();
  const likesKey = myPostCollectionKey(sessionId ?? "unauthenticated", "likes");
  const inFlightRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);
  const [optimistic, setOptimistic] = useState<{ isLiked: boolean; likesCount: number } | undefined>(undefined);

  const cachedPost = useSyncExternalStore(
    (notify) => queryClient.getQueryCache().subscribe(notifyManager.batchCalls(notify)),
    () => findPostInCache(queryClient, options.id),
    () => undefined,
  );

  const likedPosts = useSyncExternalStore(
    (notify) => queryClient.getQueryCache().subscribe(notifyManager.batchCalls(notify)),
    () => queryClient.getQueryData<readonly Post[]>(likesKey),
    () => undefined,
  );
  const likedPost = likedPosts?.find((post) => String(post.id) === String(options.id));
  const persistedIsLiked = likedPosts === undefined ? undefined : likedPost !== undefined;
  const resolvedIsLiked = optimistic?.isLiked ?? persistedIsLiked ?? cachedPost?.isLiked ?? options.isLiked;
  const resolvedLikesCount = optimistic?.likesCount ?? likedPost?.likesCount ?? cachedPost?.likesCount ?? options.likesCount;

  const mutation = useMutation<unknown, Error, boolean, { previousQueries: readonly [readonly unknown[], unknown][] }>({
    mutationFn: (wasLiked: boolean) =>
      apiFetch<unknown>({
        endpoint: `/api/posts/${encodeURIComponent(String(options.id))}/like`,
        method: wasLiked ? "DELETE" : "POST",
        token,
      }),
    onMutate: async (wasLiked: boolean) => {
      await queryClient.cancelQueries({ predicate: (q) => isPostQueryKey(q.queryKey) });
      const previousQueries = snapshotPostQueries(queryClient);
      const nextIsLiked = !wasLiked;
      const nextCount = nextIsLiked ? resolvedLikesCount + 1 : Math.max(0, resolvedLikesCount - 1);
      const post = { ...normalizePost({ ...options, ...cachedPost }), isLiked: nextIsLiked, likesCount: nextCount };

      setOptimistic({ isLiked: nextIsLiked, likesCount: nextCount });
      if (findPostInCache(queryClient, options.id) === undefined) {
        queryClient.setQueryData(["posts", String(options.id)], post);
      }
      updatePostInCache(queryClient, options.id, (cached) => ({ ...cached, isLiked: nextIsLiked, likesCount: nextCount }));
      queryClient.setQueryData<readonly Post[]>(likesKey, (previous) => {
        const otherPosts = (previous ?? []).filter((liked) => String(liked.id) !== String(options.id));
        return nextIsLiked ? [post, ...otherPosts] : otherPosts;
      });
      return { previousQueries };
    },
    onError: (_err, _vars, ctx) => {
      setOptimistic(undefined);
      restorePostQueries(queryClient, ctx?.previousQueries);
    },
    onSettled: async () => {
      await invalidatePostQueries(queryClient);
      setOptimistic(undefined);
    },
  }, queryClient);

  const toggleLike = async (): Promise<void> => {
    if (!token) {
      router?.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (inFlightRef.current || mutation.isPending) return;
    inFlightRef.current = true;
    setIsMutating(true);
    try {
      await mutation.mutateAsync(resolvedIsLiked);
    } catch {
      // Rollback handled in onError
    } finally {
      inFlightRef.current = false;
      setIsMutating(false);
    }
  };

  return {
    toggleLike,
    isLoading: isMutating || mutation.isPending,
    isLiked: resolvedIsLiked,
    likesCount: resolvedLikesCount,
  };
}
