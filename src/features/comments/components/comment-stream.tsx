"use client";

import { ErrorState } from "@/components/feedback/error-state";
import type { Comment } from "../types";
import { CommentRow } from "./comment-row";
import { CommentRowSkeleton } from "./comment-row-skeleton";

export interface CommentStreamProps {
  readonly postId: string | number;
  readonly comments: readonly Comment[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly onRetry?: () => void;
}

export function CommentStream({ postId, comments, isLoading, isError, onRetry }: Readonly<CommentStreamProps>) {
  if (isLoading) return <CommentStreamSkeleton />;
  if (isError) return <ErrorState title="Failed to load comments" message="An error occurred while loading comments." onRetry={onRetry} className="my-2 min-h-[160px] p-4" />;
  if (comments.length === 0) {
    return <p role="status" className="flex min-h-[160px] items-center justify-center text-sm text-[#A4A7AE]">No comments yet</p>;
  }
  return (
    <ul className="divide-y divide-[#1F242F]" aria-label="Comments list">
      {comments.map((comment) => <li key={comment.id}><CommentRow comment={comment} postId={postId} /></li>)}
    </ul>
  );
}

function CommentStreamSkeleton() {
  return (
    <div className="space-y-1 py-1" aria-label="Loading comments">
      <CommentRowSkeleton /><CommentRowSkeleton /><CommentRowSkeleton />
    </div>
  );
}
