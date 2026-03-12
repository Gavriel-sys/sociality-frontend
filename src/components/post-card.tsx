"use client";

import Link from "next/link";
import { Bookmark, Heart, MessageCircle, MoveRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likePost, savePost, unlikePost, unsavePost } from "@/lib/social-api";
import { buildLoginHref, getToken } from "@/lib/session";
import type { PostItem } from "@/types/social";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

type Props = {
  post: PostItem;
  forceLiked?: boolean;
  forceSaved?: boolean;
  showDetailAction?: boolean;
  onOpenLikes?: (post: PostItem) => void;
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
  onOpenLikes,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [pendingState, setPendingState] = useState<PendingState | null>(null);

  const liked = pendingState?.liked ?? forceLiked ?? post.likedByMe ?? false;
  const saved = pendingState?.saved ?? forceSaved ?? post.savedByMe ?? false;
  const likeCount = pendingState?.likeCount ?? post.likeCount;

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
    <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[#070b14]/85 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
        <Link
          href={`/profile/${post.author.username}`}
          className="flex min-w-0 items-center gap-4"
        >
          <img
            src={post.author.avatarUrl || DEFAULT_AVATAR}
            alt={post.author.name}
            className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{post.author.name}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/45">
              <span className="truncate">@{post.author.username}</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>{formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        </Link>

        {showDetailAction ? (
          <Link
            href={`/posts/${post.id}`}
            className="text-sm font-medium text-white/60 transition hover:text-white"
          >
            Open
          </Link>
        ) : null}
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
          <img
            src={post.imageUrl || DEFAULT_AVATAR}
            alt={post.caption || "Post image"}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/55">
          <button
            type="button"
            onClick={() => onOpenLikes?.(post)}
            className="font-medium text-white transition hover:text-violet-300"
          >
            {likeCount} suka
          </button>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span>{post.commentCount} komentar</span>
        </div>

        <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
          <span className="font-semibold text-white">@{post.author.username}</span>{" "}
          {post.caption || "Belum ada caption."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={liked ? "default" : "outline"}
            onClick={handleLikeClick}
            disabled={likeMutation.isPending}
            className="h-11 rounded-full px-4"
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {liked ? "Liked" : "Like"}
          </Button>

          <Button
            type="button"
            variant={saved ? "default" : "outline"}
            onClick={handleSaveClick}
            disabled={saveMutation.isPending}
            className="h-11 rounded-full px-4"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            {saved ? "Saved" : "Save"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/posts/${post.id}`)}
            className="h-11 rounded-full px-4"
          >
            <MessageCircle className="h-4 w-4" />
            Komentar
          </Button>

          {showDetailAction ? (
            <Button
              asChild
              type="button"
              variant="ghost"
              className="h-11 rounded-full px-4 text-white/75 hover:bg-white/5 hover:text-white"
            >
              <Link href={`/posts/${post.id}`}>
                Detail
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
