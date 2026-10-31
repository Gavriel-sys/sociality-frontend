"use client";

import { useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ReactReduxContext } from "react-redux";
import { updateUser } from "@/features/auth/auth-slice";
import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";
import { normalizeUserProfile, type UserProfile } from "./types";
import { buildProfileRequestBody } from "./edit-profile-request";

export interface EditProfileInput {
  readonly name?: string;
  readonly bio?: string;
  readonly avatar?: File | string;
}

export interface UseEditProfileResult {
  readonly editProfile: (input: EditProfileInput) => Promise<UserProfile | undefined>;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
}

function useAuthSnapshot() {
  const reduxContext = useContext(ReactReduxContext);
  const authState = useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { token?: string | null; sessionId?: string | null } })?.auth : undefined),
    () => undefined,
  );
  return {
    token: authState?.token ?? undefined,
    sessionId: authState?.sessionId ?? undefined,
    dispatch: reduxContext?.store?.dispatch,
  };
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return undefined;
  }
}

function useSafeQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  const fallback = useMemo(() => new QueryClient(), []);
  return client ?? fallback;
}

export function useEditProfile(): UseEditProfileResult {
  const queryClient = useSafeQueryClient();
  const router = useSafeRouter();
  const { token, sessionId, dispatch } = useAuthSnapshot();
  const inFlightRef = useRef(false);
  const [mutationError, setMutationError] = useState<Error | null>(null);

  const mutation = useMutation<UserProfile, Error, EditProfileInput>({
    mutationFn: (input: EditProfileInput) => {
      const body = buildProfileRequestBody(input);
      return apiFetch<UserProfile>({
        endpoint: "/api/me",
        method: "PATCH",
        body,
        token,
        decoder: normalizeUserProfile,
      });
    },
    onError: (error) => {
      setMutationError(error);
    },
    onSuccess: async (updated) => {
      setMutationError(null);
      dispatch?.(updateUser({ name: updated.name, bio: updated.bio, avatarUrl: updated.avatarUrl }));

      if (sessionId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.private(sessionId).me() });
        queryClient.setQueryData(queryKeys.private(sessionId).me(), updated);
        void queryClient.invalidateQueries({ queryKey: queryKeys.private(sessionId).me() });
      }
      if (updated.username) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.public.userProfile(updated.username) });
      }
      void queryClient.invalidateQueries({ queryKey: ["public", "user"] });
    },
  }, queryClient);

  const editProfile = async (input: EditProfileInput): Promise<UserProfile | undefined> => {
    if (!token) {
      router?.push("/login");
      return undefined;
    }
    if (inFlightRef.current || mutation.isPending) {
      return undefined;
    }
    inFlightRef.current = true;
    try {
      return await mutation.mutateAsync(input);
    } catch {
      return undefined;
    } finally {
      inFlightRef.current = false;
    }
  };

  return {
    editProfile,
    isLoading: mutation.isPending,
    isError: mutation.isError || mutationError !== null,
    error: mutationError ?? mutation.error ?? null,
    reset: () => {
      setMutationError(null);
      mutation.reset();
    },
  };
}
