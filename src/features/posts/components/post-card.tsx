"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ImageIcon, MoreHorizontalIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCommentsDialog } from "@/features/comments/components/post-comments-dialog";
import { formatRelativeTime } from "@/features/posts/date-utils";
import type { Post } from "@/features/posts/types";
import { usePostLikeToggle } from "@/features/posts/use-post-like-toggle";
import { usePostLikes } from "@/features/posts/use-post-likes";
import { usePostSaveToggle } from "@/features/posts/use-post-save-toggle";
import { useMySavedPosts } from "@/features/profile/use-my-collections";
import { cn } from "@/lib/utils";
import { PostActionBar } from "./post-action-bar";
import { PostLikesDialog } from "./post-likes-dialog";
import { PostOptionsDialog } from "./post-options-dialog";

export interface PostCardProps {
  readonly post: Post;
  readonly onLike?: () => void;
  readonly onComment?: () => void;
  readonly onSave?: () => void;
  readonly onShare?: () => void;
  readonly className?: string;
}

export function PostCard({ post, onLike, onComment, onSave, onShare, className }: Readonly<PostCardProps>) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const { users: likedUsers, isLoading: isLikesLoading, isError: isLikesError, refetch: refetchLikes } = usePostLikes(post.id, isLikesOpen);

  const likeToggle = usePostLikeToggle(post);
  const { data: savedPosts } = useMySavedPosts();
  const savedPost = savedPosts?.find((saved) => String(saved.id) === String(post.id));
  const saveToggle = usePostSaveToggle(savedPost ?? post);

  const handleLike = onLike ?? likeToggle.toggleLike;
  const handleComment = onComment ?? (() => setIsCommentsOpen(true));
  const handleSave = onSave ?? saveToggle.toggleSave;
  const isLiked = onLike ? post.isLiked : likeToggle.isLiked;
  const likesCount = onLike ? post.likesCount : likeToggle.likesCount;
  const isSaved = onSave ? (savedPost !== undefined || post.isSaved) : saveToggle.isSaved;

  const isLongCaption = post.caption.length > 120;
  const captionText = isLongCaption && !isCaptionExpanded ? `${post.caption.slice(0, 120)}...` : post.caption;
  const isImageUnavailable = hasImageError || !post.imageUrl;
  const authorIdentity = post.author.name || post.author.username;
  const optionsButtonClassName = "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#A4A7AE] transition-colors hover:text-[#FDFDFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B41759]";

  return (
    <>
      <article
        aria-label={`Post by ${authorIdentity}`}
        className={cn("flex w-full max-w-[361px] flex-col gap-3 rounded-2xl border border-[#1F242F] bg-[#0A0D12] p-4 text-[#FDFDFD] md:max-w-[600px]", className)}
      >
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={post.author.avatarUrl} alt={authorIdentity} fallback={authorIdentity} size="md" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#FDFDFD]">{post.author.name || `@${post.author.username}`}</span>
              <div className="flex items-center gap-1.5 text-xs text-[#A4A7AE]">
                {post.author.username && <span>@{post.author.username}</span>}
                <span>·</span>
                <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
              </div>
            </div>
          </div>
          <button type="button" aria-label="More options" onClick={() => setIsOptionsOpen(true)} className={optionsButtonClassName}>
            <MoreHorizontalIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#141820]">
          {!isImageLoaded && !isImageUnavailable && <Skeleton className="absolute inset-0 h-full w-full" />}
          {isImageUnavailable ? (
            <div role="img" aria-label="Image failed to load" className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#141820] text-[#A4A7AE]">
              <ImageIcon className="h-10 w-10 opacity-50" />
              <span className="text-xs">Image unavailable</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt={post.caption ? `Post image: ${post.caption.slice(0, 50)}` : "Post image"}
              className={cn("h-full w-full object-cover transition-opacity duration-200", isImageLoaded ? "opacity-100" : "opacity-0")}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setHasImageError(true)}
            />
          )}
        </div>

        <PostActionBar isLiked={isLiked} likesCount={likesCount} commentsCount={post.commentsCount} isSaved={isSaved} onLike={handleLike} onViewLikes={() => setIsLikesOpen(true)} onComment={handleComment} onSave={handleSave} onShare={onShare} />

        {post.caption && (
          <div className="text-sm leading-relaxed text-[#FDFDFD]">
            <span className="font-semibold text-[#FDFDFD]">{post.author.username || post.author.name}</span>{" "}
            <span className="text-[#D5D7DA]">{captionText}</span>
            {isLongCaption && (
              <button
                type="button"
                onClick={() => setIsCaptionExpanded((wasExpanded) => !wasExpanded)}
                className="text-[#7F51F9] font-semibold text-sm hover:underline cursor-pointer ml-1 inline-block"
              >
                {isCaptionExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </article>

      <PostCommentsDialog post={post} isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} />
      <PostOptionsDialog post={post} isOpen={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} />
      <PostLikesDialog
        isOpen={isLikesOpen}
        onClose={() => setIsLikesOpen(false)}
        users={likedUsers}
        isLoading={isLikesLoading}
        isError={isLikesError}
        onRetry={() => void refetchLikes()}
      />
    </>
  );
}
