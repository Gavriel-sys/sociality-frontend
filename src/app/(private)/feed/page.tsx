"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFeed } from "@/lib/social-api";
import { EmptyState } from "@/components/empty-state";
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

  const posts = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-28 pt-8 sm:px-6">
      {feedQuery.isPending ? (
        <div className="py-20 text-center text-white/65">Mengambil feed...</div>
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
        <div className="space-y-8">
          {posts.map((post) => (
            // ✅ Tidak perlu forceSaved — PostCard baca post.savedByMe & post.likedByMe langsung
            <PostCard key={post.id} post={post} />
          ))}

          {feedQuery.hasNextPage ? (
            <div className="flex justify-center pb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => feedQuery.fetchNextPage()}
                disabled={feedQuery.isFetchingNextPage}
                className="h-11 rounded-full border-white/10 bg-[#050b16] px-6 text-white"
              >
                {feedQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
