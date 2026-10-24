"use client";

import { useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext, useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { ReactReduxContext } from "react-redux";
import { apiFetch } from "@/lib/api/api-fetch";
import {
  findPostInCache, invalidatePostQueries, isPostQueryKey,
  restorePostQueries, snapshotPostQueries, updatePostInCache,
} from "./post-cache-utils";
import type { Post } from "./types";

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

function useAuthSnapshot() {
  const reduxContext = useContext(ReactReduxContext);
  const authState = useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { token?: string | null; sessionId?: string | null } })?.auth : undefined),
    () => undefined,
  );
  return { token: authState?.token ?? undefined, sessionId: authState?.sessionId ?? undefined };
}

function useSafeNavigation() {
  const router = useRouter();
  const raw = usePathname();
  const pathname = typeof raw === "string" && raw.length > 0 ? raw : "/";
  return { router, pathname };
}

function useSafeQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  const fallback = useMemo(() => new QueryClient(), []);
  return client ?? fallback;
}

export function usePostLikeToggle(options: Readonly<UsePostLikeToggleOptions>): UsePostLikeToggleResult {
  const queryClient = useSafeQueryClient();
  const { router, pathname } = useSafeNavigation();
  const { token } = useAuthSnapshot();
  const inFlightRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);
  const [optimistic, setOptimistic] = useState<{ isLiked: boolean; likesCount: number } | undefined>(undefined);

  const cachedPost = useSyncExternalStore(
    (cb) => queryClient.getQueryCache().subscribe(cb),
    () => findPostInCache(queryClient, options.id),
    () => undefined,
  );

  const resolvedIsLiked = optimistic !== undefined ? optimistic.isLiked : (cachedPost !== undefined ? cachedPost.isLiked : options.isLiked);
  const resolvedLikesCount = optimistic !== undefined ? optimistic.likesCount : (cachedPost !== undefined ? cachedPost.likesCount : options.likesCount);

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

      setOptimistic({ isLiked: nextIsLiked, likesCount: nextCount });
      if (findPostInCache(queryClient, options.id) === undefined) {
        queryClient.setQueryData(["posts", String(options.id)], { id: options.id, isLiked: nextIsLiked, likesCount: nextCount } as unknown as Post);
      }
      updatePostInCache(queryClient, options.id, (p) => ({ ...p, isLiked: nextIsLiked, likesCount: nextCount }));
      return { previousQueries };
    },
    onError: (_err, _vars, ctx) => {
      setOptimistic(undefined);
      restorePostQueries(queryClient, ctx?.previousQueries);
    },
    onSettled: () => {
      setOptimistic(undefined);
      invalidatePostQueries(queryClient);
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
