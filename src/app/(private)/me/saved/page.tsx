"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMySaved } from "@/lib/social-api";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { getNextPageParam } from "@/lib/utils";

export default function MySavedPage() {
  const savedQuery = useInfiniteQuery({
    queryKey: ["my-saved"],
    queryFn: ({ pageParam }) => fetchMySaved({ page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
  });

  const posts = savedQuery.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <PageShell
      eyebrow="Collections"
      title="Saved posts kamu"
      description="Semua post yang kamu simpan ada di sini, siap dibuka lagi kapan saja."
    >
      {savedQuery.isPending ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center text-white/70">Mengambil saved posts...</div>
      ) : savedQuery.error ? (
        <EmptyState title="Saved posts belum bisa dimuat" description="Ada kendala saat mengambil daftar post tersimpan kamu." />
      ) : posts.length === 0 ? (
        <EmptyState title="Belum ada saved posts" description="Gunakan tombol save pada post agar konten penting mudah ditemukan lagi." />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} forceSaved />
          ))}

          {savedQuery.hasNextPage ? (
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={() => savedQuery.fetchNextPage()} disabled={savedQuery.isFetchingNextPage} className="h-12 rounded-full px-6">
                {savedQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
