"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/lib/social-api";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

export default function UsersSearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading search...</div>}>
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
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const usersQuery = useQuery({
    queryKey: ["users-search", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery, { page: 1, limit: 10 }),
    enabled: debouncedQuery.length > 0,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/users/search?q=${encodeURIComponent(trimmed)}` : "/users/search");
  }

  return (
    <div className="mx-auto w-full max-w-[620px] px-4 pb-28 pt-10 sm:px-6">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className="h-12 w-full rounded-full border border-white/10 bg-[#040a16] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30"
        />
      </form>

      <div className="mt-5 overflow-hidden rounded-[18px] border border-white/10 bg-[#040a16]/98 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        {!debouncedQuery ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-white">Start typing to search</p>
            <p className="mt-2 text-xs text-white/45">Search users by name or username</p>
          </div>
        ) : usersQuery.isPending ? (
          <div className="px-5 py-10 text-center text-sm text-white/55">Searching...</div>
        ) : !usersQuery.data?.users.length ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-white">No results found</p>
            <p className="mt-2 text-xs text-white/45">Change your keyword</p>
          </div>
        ) : (
          <div className="py-2">
            {usersQuery.data.users.map((user) => (
              <Link
                key={`${user.id}-${user.username}`}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
              >
                <img
                  src={user.avatarUrl || DEFAULT_AVATAR}
                  alt={user.name}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-white/45">@{user.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
