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

export interface UsePostSaveToggleOptions {
  readonly id: string | number;
  readonly isSaved: boolean;
}

export interface UsePostSaveToggleResult {
  readonly toggleSave: () => Promise<void>;
  readonly isLoading: boolean;
  readonly isSaved: boolean;
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

export function usePostSaveToggle(options: Readonly<UsePostSaveToggleOptions>): UsePostSaveToggleResult {
  const queryClient = useSafeQueryClient();
  const { router, pathname } = useSafeNavigation();
  const { token } = useAuthSnapshot();
  const inFlightRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | undefined>(undefined);

  const cachedPost = useSyncExternalStore(
    (cb) => queryClient.getQueryCache().subscribe(cb),
    () => findPostInCache(queryClient, options.id),
    () => undefined,
  );

  const resolvedIsSaved = optimistic !== undefined ? optimistic : (cachedPost !== undefined ? cachedPost.isSaved : options.isSaved);

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

      setOptimistic(nextIsSaved);
      if (findPostInCache(queryClient, options.id) === undefined) {
        queryClient.setQueryData(["posts", String(options.id)], { id: options.id, isSaved: nextIsSaved } as unknown as Post);
      }
      updatePostInCache(queryClient, options.id, (p) => ({ ...p, isSaved: nextIsSaved }));
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
