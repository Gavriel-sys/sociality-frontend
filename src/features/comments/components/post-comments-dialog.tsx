"use client";

import { useSyncExternalStore } from "react";
import type { Post } from "@/features/posts/types";
import { useAddComment } from "../use-add-comment";
import { usePostComments } from "../use-post-comments";
import { PostCommentsModal } from "./post-comments-modal";
import { PostCommentsSheet } from "./post-comments-sheet";

export interface PostCommentsDialogProps {
  readonly post: Post;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly defaultView?: "auto" | "modal" | "sheet";
}

function subscribeMediaQuery(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mediaQuery = window.matchMedia("(min-width: 768px)");
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
  }
  mediaQuery.addListener(callback);
  return () => mediaQuery.removeListener(callback);
}

function getDesktopSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(min-width: 768px)").matches;
}

function getServerSnapshot(): boolean {
  return true;
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribeMediaQuery, getDesktopSnapshot, getServerSnapshot);
}

export function PostCommentsDialog({
  post,
  isOpen,
  onClose,
  defaultView = "auto",
}: Readonly<PostCommentsDialogProps>) {
  const isDesktop = useIsDesktop();
  const { comments, isLoading, isError, refetch } = usePostComments(post.id);
  const { addComment, isPending } = useAddComment(post.id);

  if (!isOpen) {
    return null;
  }

  const isDesktopView =
    defaultView === "modal" ? true : defaultView === "sheet" ? false : isDesktop;

  const handleSubmit = async (content: string) => {
    await addComment(content);
  };

  const handleRetry = () => {
    void refetch();
  };

  if (isDesktopView) {
    return (
      <PostCommentsModal
        post={post}
        isOpen={isOpen}
        onClose={onClose}
        comments={comments}
        isLoading={isLoading}
        isError={isError}
        isSubmitting={isPending}
        onRetry={handleRetry}
        onSubmitComment={handleSubmit}
      />
    );
  }

  return (
    <PostCommentsSheet
      isOpen={isOpen}
      onClose={onClose}
      postId={post.id}
      comments={comments}
      isLoading={isLoading}
      isError={isError}
      isSubmitting={isPending}
      onRetry={handleRetry}
      onSubmitComment={handleSubmit}
    />
  );
}
