"use client";

import { useContext, useRef, useState, useSyncExternalStore } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { ReactReduxContext } from "react-redux";
import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";
import type { PublicUserProfile } from "./types";

export interface UseFollowToggleOptions {
  readonly username: string;
  readonly isFollowing: boolean;
  readonly followersCount: number;
}

export interface UseFollowToggleResult {
  readonly toggleFollow: () => Promise<void>;
  readonly isLoading: boolean;
  readonly isFollowing: boolean;
  readonly followersCount: number;
}

function useAuthSnapshot() {
  const reduxContext = useContext(ReactReduxContext);
  const authState = useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { token?: string | null; sessionId?: string | null; user?: { username?: string } | null } })?.auth : undefined),
    () => undefined,
  );
  return {
    token: authState?.token ?? undefined,
    username: authState?.user?.username ?? undefined,
    sessionId: authState?.sessionId ?? undefined,
  };
}

function useSafeNavigation() {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = typeof rawPathname === "string" && rawPathname.length > 0 ? rawPathname : "/";
  return { router, pathname };
}

export function useFollowToggle(options: Readonly<UseFollowToggleOptions>): UseFollowToggleResult {
  const queryClient = useQueryClient();
  const { router, pathname } = useSafeNavigation();
  const { token, username: currentUsername, sessionId } = useAuthSnapshot();
  const inFlightRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);

  const profileUsername = options.username.trim();
  const profileKey = queryKeys.public.userProfile(profileUsername);

  const cachedProfile = useSyncExternalStore(
    (cb) => queryClient.getQueryCache().subscribe(cb),
    () => queryClient.getQueryData<PublicUserProfile>(profileKey),
    () => undefined,
  );

  const resolvedIsFollowing = cachedProfile !== undefined ? cachedProfile.isFollowing : options.isFollowing;
  const resolvedFollowersCount = cachedProfile !== undefined ? cachedProfile.followersCount : options.followersCount;
  const isSelf = Boolean(currentUsername && currentUsername.trim().toLowerCase() === profileUsername.toLowerCase());

  const mutation = useMutation<unknown, Error, boolean, { previousProfile?: PublicUserProfile }>({
    mutationFn: (wasFollowing: boolean) =>
      apiFetch<unknown>({
        endpoint: `/api/follow/${encodeURIComponent(profileUsername)}`,
        method: wasFollowing ? "DELETE" : "POST",
        token,
      }),
    onMutate: async (wasFollowing: boolean) => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const previousProfile = queryClient.getQueryData<PublicUserProfile>(profileKey);
      const nextIsFollowing = !wasFollowing;
      const nextCount = nextIsFollowing ? resolvedFollowersCount + 1 : Math.max(0, resolvedFollowersCount - 1);

      queryClient.setQueryData<PublicUserProfile>(profileKey, (old) => {
        if (old) return { ...old, isFollowing: nextIsFollowing, followersCount: nextCount };
        return {
          id: profileUsername, name: profileUsername, username: profileUsername, postsCount: 0,
          followersCount: nextCount, followingCount: 0, likesCount: 0, isFollowing: nextIsFollowing,
        };
      });
      return { previousProfile };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(profileKey, context?.previousProfile);
    },
    onSuccess: () => {
      if (sessionId) queryClient.invalidateQueries({ queryKey: ["private", sessionId, "feed"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKey });
    },
  });

  const toggleFollow = async (): Promise<void> => {
    if (!token) {
      router?.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isSelf || inFlightRef.current || mutation.isPending) return;
    inFlightRef.current = true;
    setIsMutating(true);
    try {
      await mutation.mutateAsync(resolvedIsFollowing);
    } catch {
      // Rollback handled in onError
    } finally {
      inFlightRef.current = false;
      setIsMutating(false);
    }
  };

  return {
    toggleFollow,
    isLoading: isMutating || mutation.isPending,
    isFollowing: resolvedIsFollowing,
    followersCount: resolvedFollowersCount,
  };
}
