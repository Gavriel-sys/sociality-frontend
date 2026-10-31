"use client";

import { useContext, useSyncExternalStore } from "react";
import type { HTMLAttributes } from "react";
import Link from "next/link";
import { ReactReduxContext } from "react-redux";
import { Avatar } from "@/components/ui/avatar";
import type { AuthUser } from "@/features/auth/types";
import { formatRelativeTime } from "@/features/posts/date-utils";
import { cn } from "@/lib/utils";
import type { Comment } from "../types";
import { useDeleteComment } from "../use-delete-comment";
import { CommentDeleteButton } from "./comment-delete-button";

export interface CommentRowProps extends HTMLAttributes<HTMLDivElement> {
  readonly comment: Comment;
  readonly postId?: string | number;
  readonly onDelete?: () => Promise<void> | void;
}

function useAuthUser(): AuthUser | undefined {
  const reduxContext = useContext(ReactReduxContext);
  return useSyncExternalStore(
    (notify) => reduxContext?.store.subscribe(notify) ?? (() => {}),
    () => (reduxContext?.store.getState() as { auth?: { user?: AuthUser } } | undefined)?.auth?.user,
    () => undefined,
  ) ?? undefined;
}

export function CommentRow({ comment, postId, onDelete, className, ...props }: Readonly<CommentRowProps>) {
  const authUser = useAuthUser();
  const { deleteComment, isLoading } = useDeleteComment(comment.id, postId);
  const isOwner = Boolean(authUser?.username && comment.author.username &&
    authUser.username.toLowerCase() === comment.author.username.toLowerCase());
  const username = comment.author.username || comment.author.name;
  const profileHref = comment.author.username ? `/profile/${encodeURIComponent(comment.author.username)}` : "#";
  return (
    <div role="article" aria-label={`Comment by ${username}`} className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 py-4", className)} {...props}>
      <Link href={profileHref} aria-label={`View ${username}'s profile`} className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]">
        <Avatar src={comment.author.avatarUrl} alt={`${username}'s avatar`} fallback={comment.author.name || username} size="md" />
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <Link href={profileHref} className="truncate text-sm font-bold text-[#FDFDFD] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]">{username}</Link>
        <time dateTime={comment.createdAt} className="text-xs text-[#A4A7AE]">{formatRelativeTime(comment.createdAt)}</time>
      </div>
      {isOwner && <CommentDeleteButton onDelete={onDelete ?? deleteComment} isLoading={isLoading} />}
      <p className="col-span-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#FDFDFD]">{comment.content}</p>
    </div>
  );
}
