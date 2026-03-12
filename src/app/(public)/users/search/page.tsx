"use client";

import { Search } from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/lib/social-api";
import { EmptyState } from "@/components/empty-state";
import { PageShell, Surface } from "@/components/page-shell";
import { UserChip } from "@/components/user-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UsersSearchPage() {
  return (
    <Suspense
      fallback={
        <PageShell
          eyebrow="Discover"
          title="Cari user dan temukan profile publik yang relevan."
          description="Menyiapkan halaman search..."
        >
          <Surface className="text-center text-white/70">Loading search...</Surface>
        </PageShell>
      }
    >
      <UsersSearchContent />
    </Suspense>
  );
}

function UsersSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const usersQuery = useQuery({
    queryKey: ["users-search", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery, { page: 1, limit: 20 }),
    enabled: debouncedQuery.length >= 2,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/users/search?q=${encodeURIComponent(trimmed)}` : "/users/search");
  }

  return (
    <PageShell
      eyebrow="Discover"
      title="Cari user dan temukan profile publik yang relevan."
      description="Search dibuat dengan debounced query agar responsif, tetap ringan, dan nyaman dipakai dari desktop maupun mobile."
    >
      <Surface>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau username"
              className="h-12 rounded-full border-white/10 bg-[#050b16] pl-11 text-white placeholder:text-white/35"
            />
          </div>
          <Button type="submit" className="h-12 rounded-full px-6">
            Search
          </Button>
        </form>
      </Surface>

      {debouncedQuery.length < 2 ? (
        <EmptyState
          title="Mulai dengan minimal 2 karakter"
          description="Contohnya: nama, username, atau potongan kata yang kamu ingat dari orang yang ingin dicari."
        />
      ) : usersQuery.isPending ? (
        <Surface className="text-center text-white/70">Mencari user...</Surface>
      ) : usersQuery.error ? (
        <EmptyState title="Hasil pencarian belum tersedia" description="Ada kendala saat memproses pencarian. Coba lagi sebentar." />
      ) : !usersQuery.data?.users.length ? (
        <EmptyState title="Tidak ada user yang cocok" description="Coba variasi keyword lain atau cek ejaan username yang kamu cari." />
      ) : (
        <div className="space-y-4">
          {usersQuery.data.users.map((user) => (
            <UserChip key={user.id} user={user} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
