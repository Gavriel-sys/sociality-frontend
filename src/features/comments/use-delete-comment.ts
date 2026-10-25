"use client";

import { useContext, useMemo, useRef, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext, useMutation } from "@tanstack/react-query";
import { ReactReduxContext } from "react-redux";
import type { AuthUser } from "@/features/auth/types";
import { invalidatePostQueries, updatePostInCache } from "@/features/posts/post-cache-utils";
import { apiFetch } from "@/lib/api/api-fetch";
import { postCommentsQueryKey, type Comment } from "./types";

export interface UseDeleteCommentResult {
  readonly deleteComment: () => Promise<void>;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
}

interface MutationContext {
  readonly previousComments?: readonly Comment[];
}

function useAuthSnapshot() {
  const reduxContext = useContext(ReactReduxContext);
  const authState = useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { token?: string | null; user?: AuthUser | null } })?.auth : undefined),
    () => undefined,
  );
  return { token: authState?.token ?? undefined, user: authState?.user ?? undefined };
}

function useSafeQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  const fallback = useMemo(() => new QueryClient(), []);
  return client ?? fallback;
}

export function useDeleteComment(
  commentId: string | number,
  postId?: string | number,
): UseDeleteCommentResult {
  const queryClient = useSafeQueryClient();
  const { token } = useAuthSnapshot();
  const inFlightRef = useRef(false);

  const mutation = useMutation<unknown, Error, void, MutationContext>({
    mutationFn: () =>
      apiFetch<unknown>({
        endpoint: `/api/comments/${encodeURIComponent(String(commentId))}`,
        method: "DELETE",
        token,
      }),
    onMutate: async () => {
      if (postId !== undefined) {
        const commentsKey = postCommentsQueryKey(postId);
        await queryClient.cancelQueries({ queryKey: commentsKey });
        const previousComments = queryClient.getQueryData<readonly Comment[]>(commentsKey);
        if (previousComments) {
          queryClient.setQueryData<readonly Comment[]>(
            commentsKey,
            previousComments.filter((c) => String(c.id) !== String(commentId)),
          );
        }
        updatePostInCache(queryClient, postId, (post) => ({
          ...post,
          commentsCount: Math.max(0, post.commentsCount - 1),
        }));
        return { previousComments };
      }
      return {};
    },
    onError: (_error, _variables, context) => {
      if (postId !== undefined) {
        const commentsKey = postCommentsQueryKey(postId);
        if (context?.previousComments !== undefined) {
          queryClient.setQueryData(commentsKey, context.previousComments);
        }
        updatePostInCache(queryClient, postId, (post) => ({
          ...post,
          commentsCount: post.commentsCount + 1,
        }));
      }
    },
    onSettled: async () => {
      if (postId !== undefined) {
        await queryClient.invalidateQueries({ queryKey: postCommentsQueryKey(postId) });
      }
      await invalidatePostQueries(queryClient);
    },
  }, queryClient);

  const deleteComment = async (): Promise<void> => {
    if (!token || !commentId || inFlightRef.current || mutation.isPending) {
      return;
    }
    inFlightRef.current = true;
    try {
      await mutation.mutateAsync();
    } catch {
      // Handled by onError rollback
    } finally {
      inFlightRef.current = false;
    }
  };

  return {
    deleteComment,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ?? null,
  };
}
