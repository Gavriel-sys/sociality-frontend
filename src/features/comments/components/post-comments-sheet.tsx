"use client";

import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import type { Comment } from "../types";
import { CommentInputForm } from "./comment-input-form";
import { CommentRow } from "./comment-row";
import { CommentRowSkeleton } from "./comment-row-skeleton";

export interface PostCommentsSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly postId?: string | number;
  readonly comments: readonly Comment[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isSubmitting?: boolean;
  readonly onRetry?: () => void;
  readonly onSubmitComment: (content: string) => Promise<void> | void;
}

export function PostCommentsSheet({
  isOpen,
  onClose,
  postId,
  comments,
  isLoading,
  isError,
  isSubmitting = false,
  onRetry,
  onSubmitComment,
}: Readonly<PostCommentsSheetProps>) {
  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Comments">
      <div className="flex flex-col">
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
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
                <CommentRow key={comment.id} comment={comment} postId={postId} />
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-[#0A0D12] pt-3 pb-1 border-t border-[#1F242F] mt-2">
          <CommentInputForm onSubmit={onSubmitComment} isLoading={isSubmitting} />
        </div>
      </div>
    </Sheet>
  );
}
