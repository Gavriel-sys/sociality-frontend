"use client";

import { useContext, useMemo, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext, useQuery } from "@tanstack/react-query";
import { ReactReduxContext } from "react-redux";
import { apiFetch } from "@/lib/api/api-fetch";
import { normalizePost, type Post } from "./types";

export interface UsePostDetailResult {
  readonly post: Post | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
}

export function postDetailQueryKey(postId: string | number) {
  return ["public", "post", String(postId)] as const;
}

function useAuthToken(): string | undefined {
  const reduxContext = useContext(ReactReduxContext);
  return useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { token?: string | null } })?.auth?.token : undefined),
    () => undefined,
  ) ?? undefined;
}

function useSafeQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  const fallback = useMemo(() => new QueryClient(), []);
  return client ?? fallback;
}

export function usePostDetail(postId: string | number): UsePostDetailResult {
  const queryClient = useSafeQueryClient();
  const token = useAuthToken();
  const idStr = postId !== undefined && postId !== null ? String(postId).trim() : "";
  const isEnabled = idStr.length > 0;

  const { data, isLoading, isError, error, refetch } = useQuery<Post, Error>(
    {
      queryKey: postDetailQueryKey(idStr),
      queryFn: ({ signal }) =>
        apiFetch<Post>({
          endpoint: `/api/posts/${encodeURIComponent(idStr)}`,
          token,
          signal,
          decoder: normalizePost,
        }),
      enabled: isEnabled,
    },
    queryClient,
  );

  return {
    post: data ?? null,
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
}
