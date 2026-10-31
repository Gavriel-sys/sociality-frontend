"use client";

import { useQuery } from "@tanstack/react-query";
import { normalizeSearchUsersResponse } from "@/features/users/types";
import type { SearchUser } from "@/features/users/types";
import { apiFetch } from "@/lib/api/api-fetch";
import { usePostQueryClient, usePostSession } from "./use-post-context";

const EMPTY_USERS: readonly SearchUser[] = [];

export interface UsePostLikesResult {
  readonly users: readonly SearchUser[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => Promise<unknown>;
}

export function usePostLikes(postId: string | number, enabled: boolean = true): UsePostLikesResult {
  const { token } = usePostSession();
  const queryClient = usePostQueryClient();
  const { data: users = EMPTY_USERS, isLoading, isError, refetch } = useQuery({
    queryKey: ["public", "post", String(postId), "likes"] as const,
    enabled: enabled && String(postId).length > 0,
    queryFn: ({ signal }) => apiFetch<unknown>({
      endpoint: `/api/posts/${encodeURIComponent(String(postId))}/likes`,
      method: "GET",
      token,
      signal,
    }).then((raw) => normalizeSearchUsersResponse(raw).users),
  }, queryClient);

  return { users, isLoading, isError, refetch };
}
