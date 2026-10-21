"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";
import { useAppSelector } from "@/lib/store/hooks";
import { normalizeUserProfile, type UserProfile } from "./types";

export interface UseMyProfileResult {
  readonly profile: UserProfile | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
}

export function useMyProfile(): UseMyProfileResult {
  const { token, sessionId } = useAppSelector((state) => state.auth);

  const queryKey = sessionId
    ? queryKeys.private(sessionId).me()
    : (["private", "unauthenticated", "me"] as const);

  const isQueryEnabled = Boolean(token && sessionId);

  const { data, isLoading, isError, error, refetch } = useQuery<UserProfile, Error>({
    queryKey,
    queryFn: ({ signal }) => {
      if (!token) {
        throw new Error("Missing authentication token.");
      }
      return apiFetch<UserProfile>({
        endpoint: "/api/me",
        token,
        signal,
        decoder: normalizeUserProfile,
      });
    },
    enabled: isQueryEnabled,
  });

  return {
    profile: data,
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
}
