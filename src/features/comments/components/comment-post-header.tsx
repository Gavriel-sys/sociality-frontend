"use client";

import { Avatar } from "@/components/ui/avatar";
import { MoreHorizontalIcon } from "@/components/ui/icons";
import { formatRelativeTime } from "@/features/posts/date-utils";
import type { Post } from "@/features/posts/types";

interface CommentPostHeaderProps {
  readonly post: Post;
  readonly onOptions: () => void;
}

export function CommentPostHeader({ post, onOptions }: Readonly<CommentPostHeaderProps>) {
  const authorName = post.author.name || post.author.username;
  return (
    <div className="space-y-3 border-b border-[#1F242F] pb-4">
      <header className="flex items-center gap-3">
        <Avatar src={post.author.avatarUrl} alt={authorName} fallback={authorName} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-semibold text-[#FDFDFD]">{authorName}</span>
          <time dateTime={post.createdAt} className="text-xs text-[#A4A7AE]">{formatRelativeTime(post.createdAt)}</time>
        </div>
        <button type="button" aria-label="More options" onClick={onOptions} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#FDFDFD] hover:bg-[#141820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]">
          <MoreHorizontalIcon />
        </button>
      </header>
      {post.caption && <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#FDFDFD]">{post.caption}</p>}
    </div>
  );
}
