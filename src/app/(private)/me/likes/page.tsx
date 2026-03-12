"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMyLikes } from "@/lib/social-api";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { getNextPageParam } from "@/lib/utils";

export default function MyLikesPage() {
  const likesQuery = useInfiniteQuery({
    queryKey: ["my-likes"],
    queryFn: ({ pageParam }) => fetchMyLikes({ page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
  });

  const posts = likesQuery.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <PageShell
      eyebrow="Collections"
      title="Post yang pernah kamu like"
      description="Gunakan halaman ini untuk meninjau konten yang pernah kamu apresiasi dan lanjutkan interaksi dari sana."
    >
      {likesQuery.isPending ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center text-white/70">Mengambil likes...</div>
      ) : likesQuery.error ? (
        <EmptyState title="Likes belum bisa dimuat" description="Ada kendala saat mengambil daftar likes kamu." />
      ) : posts.length === 0 ? (
        <EmptyState title="Belum ada likes" description="Setelah kamu memberi like pada post, daftarnya akan muncul di sini." />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} forceLiked />
          ))}

          {likesQuery.hasNextPage ? (
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={() => likesQuery.fetchNextPage()} disabled={likesQuery.isFetchingNextPage} className="h-12 rounded-full px-6">
                {likesQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
