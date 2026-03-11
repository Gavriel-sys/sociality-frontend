"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, authHeaders, unwrapResponse } from "@/lib/api";
import type { FeedData } from "@/types/social";
import { PostCard } from "@/components/post-card";

async function fetchFeed(): Promise<FeedData> {
  const res = await api.get("/feed", {
    headers: authHeaders(),
  });

  return unwrapResponse<FeedData>(res);
}

export default function FeedPage() {
  const {
    data: feed,
    isPending,
    error,
  } = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
  });

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Gagal mengambil feed</div>;
  if (!feed) return <div>Feed tidak ada</div>;

  if (feed.items.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center space-y-2">
        <h2 className="text-xl font-semibold">Belum ada post</h2>
        <p className="text-sm text-gray-500">
          Post pertama akan muncul di halaman ini.
        </p>
        <Link
          href="/posts/create"
          className="inline-block rounded border px-4 py-2 text-sm font-medium"
        >
          Buat post pertama
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Feed</h1>
        <Link
          href="/posts/create"
          className="rounded border px-4 py-2 text-sm font-medium"
        >
          Create Post
        </Link>
      </div>

      {feed.items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
