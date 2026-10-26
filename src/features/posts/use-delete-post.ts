"use client";

import { useContext, useMemo, useRef, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ReactReduxContext } from "react-redux";
import { apiFetch } from "@/lib/api/api-fetch";
import {
  invalidatePostQueries, isPostQueryKey, removePostFromCache,
  restorePostQueries, snapshotPostQueries,
} from "./post-cache-utils";

export interface UseDeletePostResult {
  readonly deletePost: () => Promise<boolean>;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
}

interface MutationContext {
  readonly previousQueries: readonly [readonly unknown[], unknown][];
}

function useAuthSnapshot() {
  const reduxContext = useContext(ReactReduxContext);
  const authState = useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { token?: string | null } })?.auth : undefined),
    () => undefined,
  );
  return { token: authState?.token ?? undefined };
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

function useSafeQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  const fallback = useMemo(() => new QueryClient(), []);
  return client ?? fallback;
}

export function useDeletePost(postId: string | number): UseDeletePostResult {
  const queryClient = useSafeQueryClient();
  const router = useSafeRouter();
  const { token } = useAuthSnapshot();
  const inFlightRef = useRef(false);

  const mutation = useMutation<unknown, Error, void, MutationContext>({
    mutationFn: () =>
      apiFetch<unknown>({
        endpoint: `/api/posts/${encodeURIComponent(String(postId))}`,
        method: "DELETE",
        token,
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ predicate: (q) => isPostQueryKey(q.queryKey) });
      const previousQueries = snapshotPostQueries(queryClient);
      removePostFromCache(queryClient, postId);
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        restorePostQueries(queryClient, context.previousQueries);
      }
    },
    onSettled: async () => {
      await invalidatePostQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      await queryClient.invalidateQueries({ queryKey: ["explore"] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  }, queryClient);

  const deletePost = async (): Promise<boolean> => {
    if (!token) {
      router?.push("/login");
      return false;
    }
    if (!postId || inFlightRef.current || mutation.isPending) {
      return false;
    }
    inFlightRef.current = true;
    try {
      await mutation.mutateAsync();
      return true;
    } catch {
      return false;
    } finally {
      inFlightRef.current = false;
    }
  };

  return {
    deletePost,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ?? null,
  };
}
