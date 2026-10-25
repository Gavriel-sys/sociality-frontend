"use client";

import { Avatar } from "@/components/ui/avatar";
import {
  BookmarkFilledIcon, BookmarkIcon, HeartFilledIcon, HeartIcon,
  ImageIcon, MessageCircleIcon, ShareIcon,
} from "@/components/ui/icons";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { CommentInputForm } from "@/features/comments/components/comment-input-form";
import { CommentRow } from "@/features/comments/components/comment-row";
import { CommentRowSkeleton } from "@/features/comments/components/comment-row-skeleton";
import type { Comment } from "@/features/comments/types";
import { useAddComment } from "@/features/comments/use-add-comment";
import { usePostComments } from "@/features/comments/use-post-comments";
import { formatRelativeTime } from "@/features/posts/date-utils";
import type { Post } from "@/features/posts/types";
import { usePostLikeToggle } from "@/features/posts/use-post-like-toggle";
import { usePostSaveToggle } from "@/features/posts/use-post-save-toggle";
import { cn } from "@/lib/utils";

export interface PostDetailViewProps {
  readonly post: Post;
  readonly className?: string;
}

function AuthorHeader({ post }: { readonly post: Post }) {
  const authorName = post.author.name || `@${post.author.username}`;
  return (
    <div className="flex items-center gap-3 p-4 border-b border-[#1F242F] shrink-0">
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
  );
}

function ActionsRow({ post }: { readonly post: Post }) {
  const { isLiked, likesCount, toggleLike } = usePostLikeToggle(post);
  const { isSaved, toggleSave } = usePostSaveToggle(post);
  const btnClass = "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#A4A7AE] transition-colors hover:text-[#FDFDFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B41759]";

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#1F242F]">
      <div className="flex items-center gap-1">
        <button type="button" aria-label={isLiked ? "Unlike post" : "Like post"} onClick={toggleLike} className={cn(btnClass, "gap-1.5 px-2")}>
          {isLiked ? <HeartFilledIcon className="h-5 w-5 text-[#B41759]" /> : <HeartIcon className="h-5 w-5 text-[#FDFDFD]" />}
          <span className={cn("text-xs font-semibold", isLiked ? "text-[#B41759]" : "text-[#A4A7AE]")}>{likesCount}</span>
        </button>
        <div className={cn(btnClass, "gap-1.5 px-2 cursor-default")} aria-label="Comments count">
          <MessageCircleIcon className="h-5 w-5 text-[#FDFDFD]" />
          <span className="text-xs font-semibold text-[#A4A7AE]">{post.commentsCount}</span>
        </div>
        <button type="button" aria-label="Share post" className={btnClass}><ShareIcon className="h-5 w-5 text-[#FDFDFD]" /></button>
      </div>
      <button type="button" aria-label={isSaved ? "Remove from saved" : "Save post"} onClick={toggleSave} className={btnClass}>
        {isSaved ? <BookmarkFilledIcon className="h-5 w-5 text-[#FDFDFD]" /> : <BookmarkIcon className="h-5 w-5 text-[#FDFDFD]" />}
      </button>
    </div>
  );
}

function CommentsStream({
  comments,
  postId,
  isLoading,
  isError,
  onRetry,
}: {
  readonly comments: readonly Comment[];
  readonly postId?: string | number;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly onRetry: () => void;
}) {
  if (isLoading) return <div className="space-y-1 py-1" aria-label="Loading comments"><CommentRowSkeleton /><CommentRowSkeleton /><CommentRowSkeleton /></div>;
  if (isError) return <ErrorState title="Failed to load comments" onRetry={onRetry} className="my-2 min-h-[160px] p-4" />;
  const items = Array.isArray(comments) ? comments : [];
  if (items.length === 0) return <EmptyState title="No comments yet" description="Be the first to share your thoughts!" className="my-2 min-h-[160px] p-4" />;
  return (
    <div className="divide-y divide-[#1F242F]/40" role="list" aria-label="Comments list">
      {items.map((c) => (
        <CommentRow key={c.id} comment={c} postId={postId} />
      ))}
    </div>
  );
}

export function PostDetailView({ post, className }: Readonly<PostDetailViewProps>) {
  const { comments, isLoading, isError, refetch } = usePostComments(post.id);
  const { addComment, isPending } = useAddComment(post.id);

  return (
    <article aria-label={`Post detail by ${post.author.name || `@${post.author.username}`}`} className={cn("flex flex-col md:flex-row rounded-2xl border border-[#1F242F] bg-[#0A0D12] overflow-hidden min-h-[480px]", className)}>
      <div className="md:hidden"><AuthorHeader post={post} /></div>
      <div className="relative aspect-square w-full md:w-1/2 bg-black flex items-center justify-center shrink-0 overflow-hidden">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt={post.caption ? `Post image: ${post.caption.slice(0, 50)}` : "Post image"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#A4A7AE]"><ImageIcon className="h-12 w-12 opacity-50" /><span className="text-xs">Image unavailable</span></div>
        )}
      </div>
      <div className="flex flex-col w-full md:w-1/2 min-h-0 bg-[#0A0D12] border-t md:border-t-0 md:border-l border-[#1F242F]">
        <div className="hidden md:block"><AuthorHeader post={post} /></div>
        <ActionsRow post={post} />
        {post.caption ? <div className="border-b border-[#1F242F] p-4 text-sm text-[#D5D7DA] shrink-0"><span className="font-semibold text-[#FDFDFD]">{post.author.username}</span> {post.caption}</div> : null}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]"><CommentsStream comments={comments} postId={post.id} isLoading={isLoading} isError={isError} onRetry={() => void refetch()} /></div>
        <div className="border-t border-[#1F242F] p-4 bg-[#0A0D12] shrink-0"><CommentInputForm onSubmit={async (content) => { await addComment(content); }} isLoading={isPending} /></div>
      </div>
    </article>
  );
}
