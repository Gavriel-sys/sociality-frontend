"use client";

import { useContext, useRef, useState } from "react";
import { ReactReduxContext } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { invalidatePostQueries } from "./post-cache-utils";
import { normalizePost } from "./types";
import type { Post } from "./types";
import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";
import { myPostCollectionKey } from "@/features/profile/my-post-collections";
import { usePostQueryClient, usePostSession } from "./use-post-context";
import { showPostSuccess } from "@/lib/store/ui-slice";

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

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return undefined;
  }
}

export function useCreatePost(): UseCreatePostResult {
  const queryClient = usePostQueryClient();
  const router = useSafeRouter();
  const { token, sessionId } = usePostSession();
  const reduxContext = useContext(ReactReduxContext);
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
    onError: (error) => {
      setMutationError(error);
    },
    onSuccess: async () => {
      setMutationError(null);
      if (sessionId) {
        await queryClient.invalidateQueries({ queryKey: myPostCollectionKey(sessionId, "posts") });
        await queryClient.invalidateQueries({ queryKey: queryKeys.private(sessionId).me() });
      }
      await invalidatePostQueries(queryClient);
      reduxContext?.store.dispatch(showPostSuccess());
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
