"use client";

import { PostActionBar } from "@/features/posts/components/post-action-bar";
import type { Post } from "@/features/posts/types";
import { usePostLikeToggle } from "@/features/posts/use-post-like-toggle";
import { usePostSaveToggle } from "@/features/posts/use-post-save-toggle";
import { CommentInputForm } from "./comment-input-form";

interface CommentPostFooterProps {
  readonly post: Post;
  readonly isSubmitting?: boolean;
  readonly onSubmitComment: (content: string) => Promise<void> | void;
  readonly onViewLikes: () => void;
  readonly onShare: () => void;
}

export function CommentPostFooter({ post, isSubmitting, onSubmitComment, onViewLikes, onShare }: Readonly<CommentPostFooterProps>) {
  const like = usePostLikeToggle(post);
  const save = usePostSaveToggle(post);
  return (
    <footer className="shrink-0 space-y-4 bg-[#0A0D12] pt-4">
      <PostActionBar isLiked={like.isLiked} likesCount={like.likesCount} commentsCount={post.commentsCount} isSaved={save.isSaved} onLike={like.toggleLike} onSave={save.toggleSave} onViewLikes={onViewLikes} onShare={onShare} />
      <CommentInputForm onSubmit={onSubmitComment} isLoading={isSubmitting} />
    </footer>
  );
}
