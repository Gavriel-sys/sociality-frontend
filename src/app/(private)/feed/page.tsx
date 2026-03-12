"use client";

import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchFeed, fetchMySaved } from "@/lib/social-api";
import { EmptyState } from "@/components/empty-state";
import { PageShell, Surface } from "@/components/page-shell";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { getNextPageParam } from "@/lib/utils";

export default function FeedPage() {
  const feedQuery = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeed({ page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
  });

  const savedQuery = useQuery({
    queryKey: ["saved-post-state"],
    queryFn: () => fetchMySaved({ page: 1, limit: 100 }),
  });

  const posts = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const savedIds = new Set(savedQuery.data?.posts.map((post) => post.id) ?? []);

  return (
    <PageShell
      eyebrow="Private timeline"
      title="Feed kamu sudah siap untuk diisi cerita baru."
      description="Lihat update dari akun yang kamu follow, lanjutkan percakapan di detail post, dan simpan konten penting tanpa kehilangan konteks."
      actions={
        <Button asChild className="h-12 rounded-full px-6">
          <Link href="/posts/create">Create Post</Link>
        </Button>
      }
    >
      <Surface className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Timeline pribadi</p>
          <p className="mt-1 text-sm text-white/55">
            Semua interaksi akan sinkron langsung ke likes, comments, saves, dan profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-white/55">
          <span className="rounded-full border border-white/10 px-4 py-2">Loading, empty, dan error state lengkap</span>
          <span className="rounded-full border border-white/10 px-4 py-2">Pagination siap dipakai</span>
        </div>
      </Surface>

      {feedQuery.isPending ? (
        <Surface className="text-center text-white/70">Mengambil feed...</Surface>
      ) : feedQuery.error ? (
        <EmptyState
          title="Feed belum bisa dimuat"
          description="Ada kendala saat mengambil timeline. Coba refresh lagi sebentar."
        />
      ) : posts.length === 0 ? (
        <EmptyState
          title="Belum ada post di feed kamu"
          description="Mulai dengan membuat post pertama atau follow akun lain supaya timeline terasa hidup."
          ctaLabel="Buat Post"
          ctaHref="/posts/create"
        />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} forceSaved={savedIds.has(post.id)} />
          ))}

          {feedQuery.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => feedQuery.fetchNextPage()}
                disabled={feedQuery.isFetchingNextPage}
                className="h-12 rounded-full px-6"
              >
                {feedQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
