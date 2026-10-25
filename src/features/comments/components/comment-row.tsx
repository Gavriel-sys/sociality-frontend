"use client";

import { useContext, useState, useSyncExternalStore, type HTMLAttributes } from "react";
import Link from "next/link";
import { ReactReduxContext } from "react-redux";
import { Avatar } from "@/components/ui/avatar";
import { TrashIcon } from "@/components/ui/icons";
import type { AuthUser } from "@/features/auth/types";
import { formatRelativeTime } from "@/features/posts/date-utils";
import { cn } from "@/lib/utils";
import type { Comment } from "../types";
import { useDeleteComment } from "../use-delete-comment";

export interface CommentRowProps extends HTMLAttributes<HTMLDivElement> {
  readonly comment: Comment;
  readonly postId?: string | number;
  readonly onDelete?: () => Promise<void> | void;
}

function useAuthUser(): AuthUser | undefined {
  const reduxContext = useContext(ReactReduxContext);
  return useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => (reduxContext ? (reduxContext.store.getState() as { auth?: { user?: AuthUser | null } })?.auth?.user : undefined),
    () => undefined,
  ) ?? undefined;
}

export function CommentRow({
  comment,
  postId,
  onDelete,
  className,
  ...props
}: Readonly<CommentRowProps>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const authUser = useAuthUser();
  const { deleteComment, isLoading } = useDeleteComment(comment.id, postId);

  const isOwner = Boolean(
    authUser?.username &&
    comment.author.username &&
    authUser.username.toLowerCase() === comment.author.username.toLowerCase(),
  );

  const username = comment.author.username || comment.author.name;
  const profileHref = comment.author.username
    ? `/profile/${encodeURIComponent(comment.author.username)}`
    : "#";

  const handleConfirmDelete = async () => {
    try {
      if (onDelete) {
        await onDelete();
      } else {
        await deleteComment();
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      role="article"
      aria-label={`Comment by ${username}`}
      className={cn("flex items-start gap-3 py-3", className)}
      {...props}
    >
      <Link
        href={profileHref}
        aria-label={`View ${username}'s profile`}
        className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
      >
        <Avatar
          src={comment.author.avatarUrl}
          alt={`${username}'s avatar`}
          fallback={comment.author.name || comment.author.username}
          size="sm"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Link
            href={profileHref}
            className="truncate text-sm font-bold text-[#FDFDFD] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
          >
            {username}
          </Link>
          <span className="text-xs text-[#A4A7AE]" aria-hidden="true">·</span>
          <time dateTime={comment.createdAt} className="shrink-0 text-xs text-[#A4A7AE]">
            {formatRelativeTime(comment.createdAt)}
          </time>
        </div>
        <p className="text-sm leading-relaxed text-[#D5D7DA] break-words whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
      {isOwner ? (
        <div className="shrink-0 self-start mt-0.5">
          {isConfirming ? (
            <div className="flex items-center gap-1.5" role="group" aria-label="Confirm deletion">
              <span className="text-xs text-[#A4A7AE]">Delete?</span>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="rounded px-2 py-0.5 text-xs font-semibold text-[#F04438] hover:bg-[#F04438]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F04438] disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isLoading}
                className="rounded px-2 py-0.5 text-xs font-medium text-[#A4A7AE] hover:text-[#FDFDFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Delete comment"
              onClick={() => setIsConfirming(true)}
              disabled={isLoading}
              className="p-1 text-[#A4A7AE] transition-colors hover:text-[#F04438] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F04438] rounded"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
