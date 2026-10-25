"use client";

import { useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ReactReduxContext } from "react-redux";
import { invalidatePostQueries } from "./post-cache-utils";
import { normalizePost, type Post } from "./types";
import { apiFetch } from "@/lib/api/api-fetch";

export interface CreatePostInput {
  readonly image: File | Blob;
  readonly caption?: string;
}

export interface UseCreatePostResult {
  readonly createPost: (input: CreatePostInput) => Promise<Post | undefined>;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
}

function useAuthSnapshot() {
  const reduxContext = useContext(ReactReduxContext);
  const authState = useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { token?: string | null } })?.auth : undefined),
    () => undefined,
  );
  return { token: authState?.token ?? undefined };
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

function useSafeQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  const fallback = useMemo(() => new QueryClient(), []);
  return client ?? fallback;
}

export function useCreatePost(): UseCreatePostResult {
  const queryClient = useSafeQueryClient();
  const router = useSafeRouter();
  const { token } = useAuthSnapshot();
  const inFlightRef = useRef(false);
  const [mutationError, setMutationError] = useState<Error | null>(null);

  const mutation = useMutation<Post, Error, FormData>({
    mutationFn: (formData: FormData) =>
      apiFetch<Post>({
        endpoint: "/api/posts",
        method: "POST",
        body: formData,
        token,
        decoder: normalizePost,
      }),
    onError: (err) => {
      setMutationError(err);
    },
    onSuccess: async () => {
      setMutationError(null);
      await invalidatePostQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      await queryClient.invalidateQueries({ queryKey: ["explore"] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  }, queryClient);

  const createPost = async (input: CreatePostInput): Promise<Post | undefined> => {
    if (!token) {
      router?.push("/login");
      return undefined;
    }

    if (inFlightRef.current || mutation.isPending) {
      return undefined;
    }

    inFlightRef.current = true;
    try {
      const formData = new FormData();
      formData.append("image", input.image);
      if (input.caption && input.caption.trim().length > 0) {
        formData.append("caption", input.caption.trim());
      }
      return await mutation.mutateAsync(formData);
    } catch {
      return undefined;
    } finally {
      inFlightRef.current = false;
    }
  };

  return {
    createPost,
    isLoading: mutation.isPending,
    isError: mutation.isError || mutationError !== null,
    error: mutation.error ?? mutationError,
  };
}
