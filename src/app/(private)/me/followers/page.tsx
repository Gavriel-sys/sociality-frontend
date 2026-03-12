"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMyFollowers } from "@/lib/social-api";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { UserChip } from "@/components/user-chip";
import { Button } from "@/components/ui/button";
import { getNextPageParam } from "@/lib/utils";

export default function MyFollowersPage() {
  const followersQuery = useInfiniteQuery({
    queryKey: ["my-followers"],
    queryFn: ({ pageParam }) => fetchMyFollowers({ page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
  });

  const users = followersQuery.data?.pages.flatMap((page) => page.users) ?? [];

  return (
    <PageShell
      eyebrow="Connections"
      title="Followers kamu"
      description="Lihat siapa saja yang sudah mengikuti akun kamu di Sociality."
    >
      {followersQuery.isPending ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center text-white/70">Mengambil followers...</div>
      ) : followersQuery.error ? (
        <EmptyState title="Followers belum bisa dimuat" description="Ada kendala saat mengambil daftar followers kamu." />
      ) : users.length === 0 ? (
        <EmptyState title="Belum ada followers" description="Saat user lain mulai follow akunmu, mereka akan tampil di sini." />
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <UserChip key={user.id} user={user} />
          ))}

          {followersQuery.hasNextPage ? (
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={() => followersQuery.fetchNextPage()} disabled={followersQuery.isFetchingNextPage} className="h-12 rounded-full px-6">
                {followersQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
