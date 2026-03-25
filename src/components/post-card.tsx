"use client";

import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { likePost, savePost, unlikePost, unsavePost } from "@/lib/social-api";
import {
  addPostToSavedCache,
  FEED_QUERY_KEY,
  ME_SAVED_QUERY_KEY,
  postQueryKey,
  removePostFromSavedCache,
  updatePostCaches,
} from "@/lib/post-cache";
import { buildLoginHref, getToken } from "@/lib/session";
import { DEFAULT_AVATAR, getAvatarSrc } from "@/lib/media";
import { formatRelativeTime } from "@/lib/utils";
import type { FeedData, PostItem, PostListData } from "@/types/social";

type Props = {
  post: PostItem;
  forceLiked?: boolean;
  forceSaved?: boolean;
  showDetailAction?: boolean;
};

type PendingState = {
  liked?: boolean;
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

  const liked = pendingState?.liked ?? post.likedByMe ?? forceLiked ?? false;
  const saved = post.savedByMe ?? forceSaved ?? false;
  const likeCount = pendingState?.likeCount ?? post.likeCount;

  const caption = post.caption?.trim() || "No caption yet.";
  const shouldClamp = caption.length > 120;
  const displayCaption =
    shouldClamp && !expanded
      ? `${caption.slice(0, 120).trimEnd()}...`
      : caption;

  function requireLogin() {
    router.push(buildLoginHref(pathname));
  }

  const likeMutation = useMutation({
    mutationFn: async () => {
      return liked ? unlikePost(post.id) : likePost(post.id);
    },
    onMutate: () => {
      const nextLiked = !liked;
      setPendingState((current) => ({
        ...current,
        liked: nextLiked,
        likeCount: likeCount + (nextLiked ? 1 : -1),
      }));
    },
    onError: () => {
      // Only rollback on error to prevent flickering
      setPendingState(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", String(post.id)] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (nextSaved: boolean) => {
      return nextSaved ? savePost(post.id) : unsavePost(post.id);
    },
    onMutate: async (nextSaved) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: postQueryKey(post.id) }),
        queryClient.cancelQueries({ queryKey: FEED_QUERY_KEY }),
        queryClient.cancelQueries({ queryKey: ME_SAVED_QUERY_KEY }),
      ]);

      const previousPost = queryClient.getQueryData<PostItem>(
        postQueryKey(post.id),
      );
      const previousFeed =
        queryClient.getQueryData<InfiniteData<FeedData>>(FEED_QUERY_KEY);
      const previousSaved =
        queryClient.getQueryData<InfiniteData<PostListData>>(ME_SAVED_QUERY_KEY);

      updatePostCaches(queryClient, post.id, (current) => ({
        ...current,
        savedByMe: nextSaved,
      }));

      if (nextSaved) {
        addPostToSavedCache(queryClient, {
          ...post,
          savedByMe: true,
        });
      } else {
        removePostFromSavedCache(queryClient, post.id);
      }

      return {
        previousPost,
        previousFeed,
        previousSaved,
      };
    },
    onError: (_error, _nextSaved, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(postQueryKey(post.id), context.previousPost);
      }

      if (context?.previousFeed) {
        queryClient.setQueryData(FEED_QUERY_KEY, context.previousFeed);
      }

      if (context?.previousSaved) {
        queryClient.setQueryData(ME_SAVED_QUERY_KEY, context.previousSaved);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postQueryKey(post.id) });
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ME_SAVED_QUERY_KEY });
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

    if (saveMutation.isPending) {
      return;
    }

    saveMutation.mutate(!saved);
  }

  return (
    <article className="mx-auto w-full max-w-[472px] border-b border-white/10 pb-8 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-4">
        <Link
          href={`/profile/${post.author.username}`}
          className="flex items-center gap-4"
        >
          <img
            src={getAvatarSrc(post.author.avatarUrl)}
            alt={post.author.name}
            className="h-14 w-14 rounded-full object-cover"
          />
          <div>
            <p className="text-xl font-semibold text-white">
              {post.author.name}
            </p>
            <p className="mt-1 text-sm text-white/55">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </Link>
      </div>

      <Link
        href={`/posts/${post.id}`}
        className="mt-4 block overflow-hidden rounded-[18px] bg-[#050b16]"
      >
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
            <Heart
              className={`h-5 w-5 ${liked ? "fill-[#ff4d93] text-[#ff4d93]" : "text-[#ff4d93]"}`}
            />
            <span>{likeCount}</span>
          </button>

          <Link
            href={`/posts/${post.id}`}
            className="inline-flex items-center gap-2 text-white transition hover:text-white/80"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentCount}</span>
          </Link>

          {showDetailAction ? (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 text-white opacity-45"
              aria-label="Share (coming soon)"
            >
              <Send className="h-5 w-5" />
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
