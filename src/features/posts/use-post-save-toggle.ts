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

export interface UsePostSaveToggleOptions {
  readonly id: string | number;
  readonly isSaved: boolean;
}

export interface UsePostSaveToggleResult {
  readonly toggleSave: () => Promise<void>;
  readonly isLoading: boolean;
  readonly isSaved: boolean;
}

export function usePostSaveToggle(options: Readonly<UsePostSaveToggleOptions>): UsePostSaveToggleResult {
  const queryClient = usePostQueryClient();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { token, sessionId } = usePostSession();
  const savedKey = myPostCollectionKey(sessionId ?? "unauthenticated", "saved");
  const inFlightRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | undefined>(undefined);

  const cachedPost = useSyncExternalStore(
    (notify) => queryClient.getQueryCache().subscribe(notifyManager.batchCalls(notify)),
    () => findPostInCache(queryClient, options.id),
    () => undefined,
  );

  const savedPosts = useSyncExternalStore(
    (notify) => queryClient.getQueryCache().subscribe(notifyManager.batchCalls(notify)),
    () => queryClient.getQueryData<readonly Post[]>(savedKey),
    () => undefined,
  );
  const persistedIsSaved = savedPosts?.some((post) => String(post.id) === String(options.id));
  const resolvedIsSaved = optimistic ?? persistedIsSaved ?? cachedPost?.isSaved ?? options.isSaved;

  const mutation = useMutation<unknown, Error, boolean, { previousQueries: readonly [readonly unknown[], unknown][] }>({
    mutationFn: (wasSaved: boolean) =>
      apiFetch<unknown>({
        endpoint: `/api/posts/${encodeURIComponent(String(options.id))}/save`,
        method: wasSaved ? "DELETE" : "POST",
        token,
      }),
    onMutate: async (wasSaved: boolean) => {
      await queryClient.cancelQueries({ predicate: (q) => isPostQueryKey(q.queryKey) });
      const previousQueries = snapshotPostQueries(queryClient);
      const nextIsSaved = !wasSaved;
      const post = normalizePost({ ...options, ...cachedPost });

      setOptimistic(nextIsSaved);
      if (findPostInCache(queryClient, options.id) === undefined) {
        queryClient.setQueryData(["posts", String(options.id)], { ...post, isSaved: nextIsSaved });
      }
      updatePostInCache(queryClient, options.id, (cached) => ({ ...cached, isSaved: nextIsSaved }));
      queryClient.setQueryData<readonly Post[]>(savedKey, (previous) => {
        const otherPosts = (previous ?? []).filter((saved) => String(saved.id) !== String(options.id));
        return nextIsSaved ? [{ ...post, isSaved: true }, ...otherPosts] : otherPosts;
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

  const toggleSave = async (): Promise<void> => {
    if (!token) {
      router?.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (inFlightRef.current || mutation.isPending) return;
    inFlightRef.current = true;
    setIsMutating(true);
    try {
      await mutation.mutateAsync(resolvedIsSaved);
    } catch {
      // Rollback handled in onError
    } finally {
      inFlightRef.current = false;
      setIsMutating(false);
    }
  };

  return {
    toggleSave,
    isLoading: isMutating || mutation.isPending,
    isSaved: resolvedIsSaved,
  };
}
