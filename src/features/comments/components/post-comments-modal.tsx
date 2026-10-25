"use client";

import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { ImageIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { formatRelativeTime } from "@/features/posts/date-utils";
import type { Post } from "@/features/posts/types";
import type { Comment } from "../types";
import { CommentInputForm } from "./comment-input-form";
import { CommentRow } from "./comment-row";
import { CommentRowSkeleton } from "./comment-row-skeleton";

export interface PostCommentsModalProps {
  readonly post: Post;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly comments: readonly Comment[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isSubmitting?: boolean;
  readonly onRetry?: () => void;
  readonly onSubmitComment: (content: string) => Promise<void> | void;
}

export function PostCommentsModal({
  post,
  isOpen,
  onClose,
  comments,
  isLoading,
  isError,
  isSubmitting = false,
  onRetry,
  onSubmitComment,
}: Readonly<PostCommentsModalProps>) {
  const authorName = post.author.name || `@${post.author.username}`;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl p-0 overflow-hidden [&>div:last-child]:mt-0 border-[#1F242F] bg-[#0A0D12]"
    >
      <div className="flex flex-col md:flex-row min-h-[480px] max-h-[85vh]">
        <div className="relative aspect-square w-full md:w-1/2 bg-black flex items-center justify-center shrink-0 overflow-hidden">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt={post.caption ? `Post image: ${post.caption.slice(0, 50)}` : "Post image"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#A4A7AE]">
              <ImageIcon className="h-12 w-12 opacity-50" />
              <span className="text-xs">Image unavailable</span>
            </div>
          )}
        </div>

        <div className="flex flex-col w-full md:w-1/2 min-h-0 bg-[#0A0D12] border-t md:border-t-0 md:border-l border-[#1F242F]">
          <div className="flex items-center gap-3 border-b border-[#1F242F] p-4 pr-16 shrink-0">
            <Avatar src={post.author.avatarUrl} alt={authorName} fallback={authorName} size="md" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-[#FDFDFD]">{authorName}</span>
              <div className="flex items-center gap-1.5 text-xs text-[#A4A7AE]">
                {post.author.username && <span>@{post.author.username}</span>}
                <span>·</span>
                <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
              </div>
            </div>
          </div>

          {post.caption ? (
            <div className="border-b border-[#1F242F] p-4 text-sm text-[#D5D7DA] shrink-0">
              <span className="font-semibold text-[#FDFDFD]">{post.author.username || authorName}</span>{" "}
              {post.caption}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
            {isLoading ? (
              <div className="space-y-1 py-1" aria-label="Loading comments">
                <CommentRowSkeleton />
                <CommentRowSkeleton />
                <CommentRowSkeleton />
              </div>
            ) : isError ? (
              <ErrorState
                title="Failed to load comments"
                message="An error occurred while loading comments."
                onRetry={onRetry}
                className="my-2 min-h-[160px] p-4"
              />
            ) : comments.length === 0 ? (
              <EmptyState
                title="No comments yet"
                description="Be the first to share your thoughts!"
                className="my-2 min-h-[160px] p-4"
              />
            ) : (
              <div className="divide-y divide-[#1F242F]/40" role="list" aria-label="Comments list">
                {comments.map((comment) => (
                  <CommentRow key={comment.id} comment={comment} postId={post.id} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#1F242F] p-4 bg-[#0A0D12] shrink-0">
            <CommentInputForm onSubmit={onSubmitComment} isLoading={isSubmitting} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
