"use client";

import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactReduxContext } from "react-redux";
import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";
import { normalizeSearchUsersResponse, type SearchUser } from "./types";

const DEFAULT_DEBOUNCE_MS = 300;
const EMPTY_USERS: readonly SearchUser[] = [];

export interface UseSearchUsersResult {
  readonly users: readonly SearchUser[];
  readonly total: number;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
  readonly debouncedQuery: string;
}

function useOptionalToken(): string | undefined {
  const reduxContext = useContext(ReactReduxContext);
  if (!reduxContext) {
    return undefined;
  }
  const state = reduxContext.store.getState() as { auth?: { token?: string } } | undefined;
  return state?.auth?.token;
}

export function useSearchUsers(
  query: string,
  page: number = 1,
  limit: number = 20,
  debounceDelayMs: number = DEFAULT_DEBOUNCE_MS,
): UseSearchUsersResult {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const token = useOptionalToken();

  useEffect(() => {
    const delay = query.trim().length === 0 ? 0 : debounceDelayMs;
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceDelayMs]);

  const trimmedQuery = debouncedQuery.trim();
  const isEnabled = trimmedQuery.length >= 1 && query.trim().length >= 1;

  const queryKey = queryKeys.public.search(
    trimmedQuery.length >= 1 ? { query: trimmedQuery, page, limit } : undefined,
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const endpoint = `/api/users/search?q=${encodeURIComponent(trimmedQuery)}&page=${page}&limit=${limit}`;
      const raw = await apiFetch<unknown>({
        endpoint,
        token: token ?? undefined,
        signal,
      });
      return normalizeSearchUsersResponse(raw);
    },
    enabled: isEnabled,
  });

  if (!isEnabled) {
    return {
      users: EMPTY_USERS,
      total: 0,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: async () => undefined,
      debouncedQuery,
    };
  }

  return {
    users: data?.users ?? EMPTY_USERS,
    total: data?.total ?? 0,
    isLoading,
    isFetching,
    isError,
    error: error ?? null,
    refetch,
    debouncedQuery,
  };
}
