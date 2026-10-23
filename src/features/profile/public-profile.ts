"use client";

import { useContext, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactReduxContext } from "react-redux";
import { normalizePost, type Post } from "@/features/posts/types";
import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";
import { normalizePublicUserProfile, type PublicUserProfile } from "./types";

const EMPTY_POSTS: readonly Post[] = [];

export interface UsePublicProfileResult {
  readonly profile: PublicUserProfile | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
}

export interface UseUserPostsResult {
  readonly posts: readonly Post[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
}

export interface UseUserLikesResult {
  readonly likedPosts: readonly Post[];
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

function extractRawPosts(raw: unknown): readonly unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw !== null) {
    const c = raw as Record<string, unknown>;
    if (Array.isArray(c.posts)) return c.posts;
    if (Array.isArray(c.likes)) return c.likes;
    if (Array.isArray(c.data)) return c.data;
    if (typeof c.data === "object" && c.data !== null) {
      const nested = c.data as Record<string, unknown>;
      return (nested.posts ?? nested.likes ?? nested.data ?? []) as readonly unknown[];
    }
  }
  return [];
}

export function normalizePostList(raw: unknown): readonly Post[] {
  return extractRawPosts(raw).map((item) => normalizePost(item));
}

export function usePublicProfile(username: string): UsePublicProfileResult {
  const token = useOptionalToken();
  const trimmed = username.trim();
  const isEnabled = trimmed.length > 0;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.public.userProfile(trimmed),
    queryFn: ({ signal }) =>
      apiFetch<unknown>({ endpoint: `/api/users/${encodeURIComponent(trimmed)}`, token, signal }).then(
        normalizePublicUserProfile,
      ),
    enabled: isEnabled,
  });

  return {
    profile: isEnabled ? (data ?? null) : null,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? isError : false,
    error: isEnabled ? (error ?? null) : null,
    refetch: isEnabled ? refetch : async () => undefined,
  };
}

export function useUserPosts(username: string): UseUserPostsResult {
  const token = useOptionalToken();
  const trimmed = username.trim();
  const isEnabled = trimmed.length > 0;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public", "user", trimmed, "posts"] as const,
    queryFn: ({ signal }) =>
      apiFetch<unknown>({ endpoint: `/api/users/${encodeURIComponent(trimmed)}/posts`, token, signal }).then(
        normalizePostList,
      ),
    enabled: isEnabled,
  });

  return {
    posts: isEnabled ? (data ?? EMPTY_POSTS) : EMPTY_POSTS,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? isError : false,
    error: isEnabled ? (error ?? null) : null,
    refetch: isEnabled ? refetch : async () => undefined,
  };
}

export function useUserLikes(username: string): UseUserLikesResult {
  const token = useOptionalToken();
  const trimmed = username.trim();
  const isEnabled = trimmed.length > 0;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public", "user", trimmed, "likes"] as const,
    queryFn: ({ signal }) =>
      apiFetch<unknown>({ endpoint: `/api/users/${encodeURIComponent(trimmed)}/likes`, token, signal }).then(
        normalizePostList,
      ),
    enabled: isEnabled,
  });

  return {
    likedPosts: isEnabled ? (data ?? EMPTY_POSTS) : EMPTY_POSTS,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? isError : false,
    error: isEnabled ? (error ?? null) : null,
    refetch: isEnabled ? refetch : async () => undefined,
  };
}
