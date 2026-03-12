"use client";

import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likePost, savePost, unlikePost, unsavePost } from "@/lib/social-api";
import { buildLoginHref, getToken } from "@/lib/session";
import type { PostItem } from "@/types/social";
import { formatRelativeTime } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

type Props = {
  post: PostItem;
  forceLiked?: boolean;
  forceSaved?: boolean;
  showDetailAction?: boolean;
};

type PendingState = {
  liked?: boolean;
  saved?: boolean;
  likeCount?: number;
};

export function PostCard({
  post,
  forceLiked,
  forceSaved,
  showDetailAction = true,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState(false);
  const [pendingState, setPendingState] = useState<PendingState | null>(null);

  const liked = pendingState?.liked ?? forceLiked ?? post.likedByMe ?? false;
  const saved = pendingState?.saved ?? forceSaved ?? post.savedByMe ?? false;
  const likeCount = pendingState?.likeCount ?? post.likeCount;
  const caption = post.caption?.trim() || "No caption yet.";
  const shouldClamp = caption.length > 120;
  const displayCaption = shouldClamp && !expanded ? `${caption.slice(0, 120).trimEnd()}...` : caption;

  function requireLogin() {
    router.push(buildLoginHref(pathname));
  }

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (liked) {
        return unlikePost(post.id);
      }

      return likePost(post.id);
    },
    onMutate: () => {
      const nextLiked = !liked;
      setPendingState({
        ...pendingState,
        liked: nextLiked,
        likeCount: likeCount + (nextLiked ? 1 : -1),
      });
    },
    onError: () => {
      setPendingState(null);
    },
    onSuccess: (data) => {
      setPendingState((current) => ({
        ...current,
        liked: data.liked,
        likeCount: data.likeCount,
      }));
      queryClient.invalidateQueries({});
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (saved) {
        return unsavePost(post.id);
      }

      return savePost(post.id);
    },
    onMutate: () => {
      setPendingState({
        ...pendingState,
        saved: !saved,
      });
    },
    onError: () => {
      setPendingState(null);
    },
    onSuccess: (data) => {
      setPendingState((current) => ({
        ...current,
        saved: data.saved,
      }));
      queryClient.invalidateQueries({});
    },
  });

  function handleLikeClick() {
    if (!getToken()) {
      requireLogin();
      return;
    }

    likeMutation.mutate();
  }

  function handleSaveClick() {
    if (!getToken()) {
      requireLogin();
      return;
    }

    saveMutation.mutate();
  }

  return (
    <article className="mx-auto w-full max-w-[472px] border-b border-white/10 pb-8 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-4">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-4">
          <img
            src={post.author.avatarUrl || DEFAULT_AVATAR}
            alt={post.author.name}
            className="h-14 w-14 rounded-full object-cover"
          />
          <div>
            <p className="text-xl font-semibold text-white">{post.author.name}</p>
            <p className="mt-1 text-sm text-white/55">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </Link>
      </div>

      <Link href={`/posts/${post.id}`} className="mt-4 block overflow-hidden rounded-[18px] bg-[#050b16]">
        <img
          src={post.imageUrl || DEFAULT_AVATAR}
          alt={post.caption || "Post image"}
          className="aspect-square w-full object-cover"
        />
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-5 text-sm text-white">
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={likeMutation.isPending}
            className="inline-flex items-center gap-2 text-white transition hover:text-[#ff4d93]"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-[#ff4d93] text-[#ff4d93]" : "text-[#ff4d93]"}`} />
            <span>{likeCount}</span>
          </button>

          <Link href={`/posts/${post.id}`} className="inline-flex items-center gap-2 text-white transition hover:text-white/80">
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentCount}</span>
          </Link>

          {showDetailAction ? (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 text-white opacity-45"
              aria-label="Send disabled"
            >
              <Send className="h-5 w-5" />
              <span>{post.commentCount}</span>
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={saveMutation.isPending}
          className="text-white transition hover:text-white/80"
          aria-label={saved ? "Unsave post" : "Save post"}
        >
          <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-lg font-semibold text-white">{post.author.name}</p>
        <p className="text-sm leading-8 text-white/78">{displayCaption}</p>
        {shouldClamp ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="text-sm font-medium text-violet-400 transition hover:text-violet-300"
          >
            {expanded ? "Show Less" : "Show More"}
          </button>
        ) : null}
      </div>
    </article>
  );
}


