"use client";

import { useContext, useMemo, useRef, useSyncExternalStore } from "react";
import { QueryClient, QueryClientContext, useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { ReactReduxContext } from "react-redux";
import type { AuthUser } from "@/features/auth/types";
import { invalidatePostQueries, updatePostInCache } from "@/features/posts/post-cache-utils";
import { apiFetch } from "@/lib/api/api-fetch";
import {
  commentInputSchema,
  normalizeComment,
  postCommentsQueryKey,
  type Comment,
} from "./types";

export interface UseAddCommentResult {
  readonly addComment: (content: string) => Promise<Comment | undefined>;
  readonly mutate: (content: string) => void;
  readonly mutateAsync: (content: string) => Promise<Comment>;
  readonly isLoading: boolean;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
}

interface MutationContext {
  readonly previousComments: readonly Comment[];
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

function useSafeNavigation() {
  const router = useRouter();
  const raw = usePathname();
  return { router, pathname: typeof raw === "string" && raw.length > 0 ? raw : "/" };
}

function useSafeQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  const fallback = useMemo(() => new QueryClient(), []);
  return client ?? fallback;
}

function buildOptimisticComment(content: string, user?: AuthUser): Comment {
  const userRec = user as Record<string, unknown> | undefined;
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content,
    createdAt: new Date().toISOString(),
    author: {
      id: user?.id ?? "me",
      name: user?.name ?? user?.username ?? "You",
      username: user?.username ?? "you",
      avatarUrl: (userRec?.avatarUrl ?? userRec?.avatar) as string | undefined,
    },
  };
}

export function useAddComment(postId: string | number): UseAddCommentResult {
  const queryClient = useSafeQueryClient();
  const { router, pathname } = useSafeNavigation();
  const { token, user } = useAuthSnapshot();
  const inFlightRef = useRef(false);
  const commentsKey = postCommentsQueryKey(postId);

  const mutation = useMutation<Comment, Error, string, MutationContext>({
    mutationFn: (content) =>
      apiFetch<Comment>({
        endpoint: `/api/posts/${encodeURIComponent(String(postId))}/comments`,
        method: "POST",
        body: { text: content },
        token,
        decoder: normalizeComment,
      }),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: commentsKey });
      const previousComments = queryClient.getQueryData<readonly Comment[]>(commentsKey) ?? [];
      const optimistic = buildOptimisticComment(content, user);

      queryClient.setQueryData<readonly Comment[]>(commentsKey, [...previousComments, optimistic]);
      updatePostInCache(queryClient, postId, (post) => ({ ...post, commentsCount: post.commentsCount + 1 }));
      return { previousComments };
    },
    onError: (_error, _content, context) => {
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(commentsKey, context.previousComments);
      }
      updatePostInCache(queryClient, postId, (post) => ({ ...post, commentsCount: Math.max(0, post.commentsCount - 1) }));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: commentsKey });
      await invalidatePostQueries(queryClient);
    },
  }, queryClient);

  const executeAdd = async (rawContent: string): Promise<Comment | undefined> => {
    if (!token) {
      router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return undefined;
    }
    const validated = commentInputSchema.parse(rawContent);
    if (inFlightRef.current || mutation.isPending) return undefined;
    inFlightRef.current = true;
    try {
      return await mutation.mutateAsync(validated);
    } finally {
      inFlightRef.current = false;
    }
  };

  return {
    addComment: executeAdd,
    mutate: (content) => { void executeAdd(content); },
    mutateAsync: async (content) => {
      const comment = await executeAdd(content);
      if (comment === undefined) throw new Error("Failed to add comment: unauthenticated or in-flight");
      return comment;
    },
    isLoading: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ?? null,
    reset: mutation.reset,
  };
}
