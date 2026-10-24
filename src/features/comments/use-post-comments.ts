"use client";

import { useContext, useMemo, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext, useQuery } from "@tanstack/react-query";
import { ReactReduxContext } from "react-redux";
import { apiFetch } from "@/lib/api/api-fetch";
import { normalizeCommentList, postCommentsQueryKey, type Comment } from "./types";

export interface UsePostCommentsResult {
  readonly comments: readonly Comment[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
}

function useAuthToken(): string | undefined {
  const reduxContext = useContext(ReactReduxContext);
  const token = useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { token?: string | null } })?.auth?.token : undefined),
    () => undefined,
  );
  return token ?? undefined;
}

function useSafeQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  const fallback = useMemo(() => new QueryClient(), []);
  return client ?? fallback;
}

export function usePostComments(postId: string | number): UsePostCommentsResult {
  const queryClient = useSafeQueryClient();
  const token = useAuthToken();
  const idStr = postId !== undefined && postId !== null ? String(postId).trim() : "";
  const isEnabled = idStr.length > 0;

  const { data, isLoading, isError, error, refetch } = useQuery<readonly Comment[], Error>(
    {
      queryKey: postCommentsQueryKey(postId),
      queryFn: ({ signal }) =>
        apiFetch<readonly Comment[]>({
          endpoint: `/api/posts/${encodeURIComponent(idStr)}/comments`,
          token,
          signal,
          decoder: normalizeCommentList,
        }),
      enabled: isEnabled,
    },
    queryClient,
  );

  return {
    comments: data ?? [],
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
}
