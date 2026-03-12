"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMyFollowing } from "@/lib/social-api";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { UserChip } from "@/components/user-chip";
import { Button } from "@/components/ui/button";
import { getNextPageParam } from "@/lib/utils";

export default function MyFollowingPage() {
  const followingQuery = useInfiniteQuery({
    queryKey: ["my-following"],
    queryFn: ({ pageParam }) => fetchMyFollowing({ page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
  });

  const users = followingQuery.data?.pages.flatMap((page) => page.users) ?? [];

  return (
    <PageShell
      eyebrow="Connections"
      title="Akun yang kamu follow"
      description="Pantau akun mana saja yang sedang membentuk isi feed personal kamu."
    >
      {followingQuery.isPending ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center text-white/70">Mengambil following...</div>
      ) : followingQuery.error ? (
        <EmptyState title="Following belum bisa dimuat" description="Ada kendala saat mengambil daftar akun yang kamu follow." />
      ) : users.length === 0 ? (
        <EmptyState title="Belum follow siapa pun" description="Cari user baru dari halaman search lalu mulai follow agar feed kamu hidup." />
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <UserChip key={user.id} user={user} />
          ))}

          {followingQuery.hasNextPage ? (
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={() => followingQuery.fetchNextPage()} disabled={followingQuery.isFetchingNextPage} className="h-12 rounded-full px-6">
                {followingQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
