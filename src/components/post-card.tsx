"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, authHeaders } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { PostItem } from "@/types/social";
import { Button } from "@/components/ui/button";

type Props = {
  post: PostItem;
  showActions?: boolean;
};

export function PostCard({ post, showActions = true }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const author = post.author ?? post.user;
  const username = author?.username ?? "unknown";
  const imageUrl = post.imageUrl ?? "/avatars/default-avatar.png";

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.isLiked) {
        await api.delete(`/likes/${post.id}`, {
          headers: authHeaders(),
        });
      } else {
        await api.post(
          `/likes/${post.id}`,
          {},
          {
            headers: authHeaders(),
          },
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", String(post.id)] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (post.isSaved) {
        await api.delete(`/saves/${post.id}`, {
          headers: authHeaders(),
        });
      } else {
        await api.post(
          `/saves/${post.id}`,
          {},
          {
            headers: authHeaders(),
          },
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", String(post.id)] });
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
  });

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/profile/${username}`} className="font-semibold">
          @{username}
        </Link>
        <div className="text-xs text-gray-500">
          {formatDate(post.createdAt)}
        </div>
      </div>

      <img
        src={imageUrl}
        alt={post.caption ?? "Post image"}
        className="w-full rounded-xl object-cover"
      />

      <div className="space-y-1">
        <div className="text-sm">
          <span className="font-semibold">@{username}</span>{" "}
          {post.caption ?? "-"}
        </div>
        <div className="text-xs text-gray-500">
          {post.likeCount ?? 0} likes · {post.commentCount ?? 0} comments
        </div>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
          >
            {post.isLiked ? "Unlike" : "Like"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {post.isSaved ? "Unsave" : "Save"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/posts/${post.id}`)}
          >
            Detail
          </Button>
        </div>
      )}
    </div>
  );
}
