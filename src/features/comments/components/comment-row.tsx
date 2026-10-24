import type { HTMLAttributes } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/features/posts/date-utils";
import { cn } from "@/lib/utils";
import type { Comment } from "../types";

export interface CommentRowProps extends HTMLAttributes<HTMLDivElement> {
  readonly comment: Comment;
}

export function CommentRow({ comment, className, ...props }: Readonly<CommentRowProps>) {
  const username = comment.author.username || comment.author.name;
  const profileHref = comment.author.username
    ? `/profile/${encodeURIComponent(comment.author.username)}`
    : "#";

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
    </div>
  );
}
