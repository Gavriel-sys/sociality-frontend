"use client";

import { useContext, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactReduxContext } from "react-redux";
import { normalizeSearchUser, type SearchUser } from "@/features/users/types";
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
  if (Array.isArray(raw)) {
    return raw.map(normalizeSearchUser);
  }
  if (typeof raw === "object" && raw !== null) {
    const record = raw as Record<string, unknown>;
    const list = Array.isArray(record.users)
      ? record.users
      : Array.isArray(record.data)
        ? record.data
        : Array.isArray(record.following)
          ? record.following
          : Array.isArray(record.followers)
            ? record.followers
            : [];
    return list.map(normalizeSearchUser);
  }
  return EMPTY_USERS;
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
