"use client";

import { useContext, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactReduxContext } from "react-redux";
import { normalizeSearchUsersResponse } from "@/features/users/types";
import type { SearchUser } from "@/features/users/types";
import { apiFetch } from "@/lib/api/api-fetch";

const EMPTY_USERS: readonly SearchUser[] = [];

export interface UseUserNetworkResult {
  readonly users: readonly SearchUser[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
}

function useOptionalToken(): string | undefined {
  const reduxContext = useContext(ReactReduxContext);
  return useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => {
      if (!reduxContext) return undefined;
      const state = reduxContext.store.getState() as { auth?: { token?: string | null } } | undefined;
      return state?.auth?.token ?? undefined;
    },
    () => undefined,
  );
}

function extractUsers(raw: unknown): readonly SearchUser[] {
  if (typeof raw !== "object" || raw === null) return EMPTY_USERS;
  const response = raw as Record<string, unknown>;
  if (Array.isArray(response.users) || Array.isArray(response.data)) return normalizeSearchUsersResponse(raw).users;
  const users = Array.isArray(response.following) ? response.following
    : Array.isArray(response.followers) ? response.followers : raw;
  return normalizeSearchUsersResponse(users).users;
}

export function useUserFollowers(username: string): UseUserNetworkResult {
  const token = useOptionalToken();
  const trimmed = username.trim();
  const isEnabled = trimmed.length > 0;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public", "user", trimmed, "followers"] as const,
    queryFn: ({ signal }) =>
      apiFetch<unknown>({
        endpoint: `/api/users/${encodeURIComponent(trimmed)}/followers`,
        token,
        signal,
      }).then(extractUsers),
    enabled: isEnabled,
  });

  return {
    users: isEnabled ? (data ?? EMPTY_USERS) : EMPTY_USERS,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? isError : false,
    error: isEnabled ? (error ?? null) : null,
    refetch: isEnabled ? refetch : async () => undefined,
  };
}

export function useUserFollowing(username: string): UseUserNetworkResult {
  const token = useOptionalToken();
  const trimmed = username.trim();
  const isEnabled = trimmed.length > 0;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public", "user", trimmed, "following"] as const,
    queryFn: ({ signal }) =>
      apiFetch<unknown>({
        endpoint: `/api/users/${encodeURIComponent(trimmed)}/following`,
        token,
        signal,
      }).then(extractUsers),
    enabled: isEnabled,
  });

  return {
    users: isEnabled ? (data ?? EMPTY_USERS) : EMPTY_USERS,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? isError : false,
    error: isEnabled ? (error ?? null) : null,
    refetch: isEnabled ? refetch : async () => undefined,
  };
}
