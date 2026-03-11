"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authHeaders, unwrapResponse } from "@/lib/api";
import { PostCard } from "@/components/post-card";
import type { CommentItem, PostItem } from "@/types/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

type CommentsData =
  | {
      items?: CommentItem[];
    }
  | CommentItem[];

async function fetchPost(id: string): Promise<PostItem> {
  const res = await api.get(`/posts/${id}`, {
    headers: authHeaders(),
  });

  return unwrapResponse<PostItem>(res);
}

async function fetchComments(id: string): Promise<CommentItem[]> {
  const res = await api.get(`/comments/${id}`, {
    headers: authHeaders(),
  });

  const data = unwrapResponse<CommentsData>(res);
  return Array.isArray(data) ? data : (data.items ?? []);
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = String(params.id);
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: post, isPending: postLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
  });

  const { data: comments = [], isPending: commentsLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
  });

  const createComment = useMutation({
    mutationFn: async () => {
      await api.post(
        `/comments/${postId}`,
        { content: comment, comment, text: comment },
        { headers: authHeaders() },
      );
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${postId}`, {
        headers: authHeaders(),
      });
    },
    onSuccess: () => {
      window.location.href = "/feed";
    },
  });

  const normalizedComments = useMemo(() => comments ?? [], [comments]);

  if (postLoading) return <div>Loading post...</div>;
  if (!post) return <div>Post tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <PostCard post={post} showActions />

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Tambah Komentar</h2>

        <div className="flex gap-2">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tulis komentar..."
          />
          <Button
            type="button"
            onClick={() => createComment.mutate()}
            disabled={createComment.isPending || !comment.trim()}
          >
            Kirim
          </Button>
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Komentar</h2>
          <div className="text-sm text-gray-500">
            {commentsLoading
              ? "Loading..."
              : `${normalizedComments.length} komentar`}
          </div>
        </div>

        {normalizedComments.length === 0 ? (
          <div className="text-sm text-gray-500">Belum ada komentar</div>
        ) : (
          normalizedComments.map((item) => {
            const user = item.author ?? item.user;
            return (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="font-medium">
                  @{user?.username ?? "unknown"}
                </div>
                <div className="text-sm">
                  {item.content ?? item.comment ?? item.text ?? "-"}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(item.createdAt)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-xl border p-4">
        <Button
          type="button"
          variant="destructive"
          onClick={() => deletePost.mutate()}
          disabled={deletePost.isPending}
        >
          Hapus Post Ini
        </Button>
      </div>
    </div>
  );
}
