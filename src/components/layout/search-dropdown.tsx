"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { SearchUser } from "@/features/users/types";
import type { UseSearchUsersResult } from "@/features/users/use-search-users";

interface SearchDropdownProps {
  readonly id: string;
  readonly query: string;
  readonly search: UseSearchUsersResult;
  readonly onSelect: () => void;
}

function isSearchPending({ query, search }: Pick<SearchDropdownProps, "query" | "search">): boolean {
  return search.isLoading || search.isFetching || query.trim() !== search.debouncedQuery.trim();
}

function SearchUserLink({ user, onSelect }: { readonly user: SearchUser; readonly onSelect: () => void }) {
  const displayName = user.name.trim() || user.username;
  return (
    <li>
      <Link href={`/profile/${encodeURIComponent(user.username)}`} onClick={onSelect}
        aria-label={`View ${displayName}'s profile`}
        className="flex items-center gap-2 rounded-xl p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar src={user.avatarUrl} fallback={displayName} alt={`${displayName}'s avatar`} size="lg" />
        <span className="flex min-w-0 flex-col gap-2 text-sm leading-5">
          <span className="truncate font-bold text-foreground">{displayName}</span>
          <span className="truncate text-muted-foreground">@{user.username}</span>
        </span>
      </Link>
    </li>
  );
}

function SearchResults({ query, search, onSelect }: Omit<SearchDropdownProps, "id">) {
  if (isSearchPending({ query, search })) {
    return <div role="status" className="flex min-h-[calc(100dvh-144px)] items-center justify-center text-sm text-muted-foreground md:min-h-[170px]">Searching users…</div>;
  }
  if (search.isError) {
    return (
      <div role="alert" className="flex min-h-[calc(100dvh-144px)] flex-col items-center justify-center gap-3 text-sm md:min-h-[170px]">
        <p className="text-foreground">Unable to search users</p>
        <button type="button" onClick={() => void search.refetch()}
          className="rounded px-2 text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Try again</button>
      </div>
    );
  }
  if (search.users.length === 0) {
    return (
      <div role="status" className="flex min-h-[calc(100dvh-144px)] flex-col items-center justify-center gap-3 px-4 text-center md:min-h-[170px]">
        <p className="text-base font-bold leading-6 text-foreground">No results found</p>
        <p className="text-sm leading-5 text-muted-foreground">Change your keyword</p>
      </div>
    );
  }
  return <ul aria-label="Matching users">{search.users.map((user) => <SearchUserLink key={user.id} user={user} onSelect={onSelect} />)}</ul>;
}

export function SearchDropdown({ id, ...props }: SearchDropdownProps) {
  return (
    <section id={id} aria-label="Search results" aria-busy={isSearchPending(props)}
      className="absolute left-0 top-full z-50 h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] w-full overflow-y-auto bg-black px-1 py-2 [color-scheme:dark] [scrollbar-width:thin] md:mt-3 md:h-auto md:max-h-[min(384px,calc(100dvh-96px))] md:rounded-[20px] md:border md:border-border md:bg-popover md:px-[7px] md:py-[11px]">
      <SearchResults {...props} />
    </section>
  );
}
