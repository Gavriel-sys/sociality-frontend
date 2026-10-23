"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { UserRow } from "@/features/users/components/user-row";
import { UserRowSkeleton } from "@/features/users/components/user-row-skeleton";
import { useSearchUsers } from "@/features/users/use-search-users";
import { useAppSelector } from "@/lib/store/hooks";

const USERS_PER_PAGE = 20;

function SearchContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams?.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [page, setPage] = useState(1);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const authUser = useAppSelector((state) => state.auth.user);

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
    setPage(1);
  }

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
    const trimmed = nextQuery.trim();
    const nextUrl = trimmed.length > 0 ? `/users/search?q=${encodeURIComponent(trimmed)}` : "/users/search";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", nextUrl);
    }
  };

  const { users, total, isLoading, isError, error, refetch } = useSearchUsers(query, page, USERS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(total / USERS_PER_PAGE));
  const isQueryEmpty = query.trim().length === 0;

  return (
    <div className="min-h-screen bg-black text-[#FDFDFD] pb-32">
      <Header
        searchValue={query}
        onSearchChange={handleQueryChange}
        userFallback={authUser?.name || authUser?.username}
      />
      <main className="mx-auto w-full max-w-[361px] md:max-w-[600px] px-4 pt-6 space-y-6">
        <h1 className="sr-only">Search Users</h1>

        <div className="relative w-full">
          <SearchIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A4A7AE]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by name or username..."
            aria-label="Search users"
            className="h-11 min-h-[44px] w-full rounded-xl border border-[#1F242F] bg-[#0A0D12] pl-10 pr-10 text-sm text-[#FDFDFD] placeholder-[#A4A7AE]/60 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => handleQueryChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#A4A7AE] hover:text-[#FDFDFD]"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {isQueryEmpty ? (
          <EmptyState
            title="Find creators & friends"
            description="Type a name or username above to discover people."
            icon={<SearchIcon className="h-8 w-8 text-[#A4A7AE]" />}
          />
        ) : isLoading ? (
          <div className="space-y-2" role="status" aria-label="Loading users">
            <UserRowSkeleton /><UserRowSkeleton /><UserRowSkeleton /><UserRowSkeleton />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to load search results"
            message={error?.message ?? "An unexpected error occurred while searching."}
            onRetry={() => void refetch()}
          />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try searching with a different name or username." />
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              {users.map((user) => <UserRow key={user.id} user={user} />)}
            </div>
            {total > USERS_PER_PAGE ? (
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <span className="text-xs text-[#A4A7AE]">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </main>
      <FloatingNav />
    </div>
  );
}

export default function UsersSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SearchContent />
    </Suspense>
  );
}
