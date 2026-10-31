"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { useSearchUsers } from "@/features/users/use-search-users";
import { SearchDropdown } from "./search-dropdown";
import { useSearchDismissal } from "./use-search-dismissal";

interface HeaderSearchProps {
  readonly searchValue?: string;
  readonly onSearchChange?: (value: string) => void;
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return undefined;
  }
}

export function HeaderSearch({ searchValue = "", onSearchChange }: HeaderSearchProps) {
  const router = useSafeRouter();
  const dropdownId = useId();
  const [query, setQuery] = useState(searchValue);
  const [previousSearchValue, setPreviousSearchValue] = useState(searchValue);
  const { searchRef, isOpen, openSearch, closeSearch } = useSearchDismissal();
  const search = useSearchUsers(query);
  const isDropdownVisible = isOpen && query.trim().length > 0;

  if (searchValue !== previousSearchValue) {
    setPreviousSearchValue(searchValue);
    setQuery(searchValue);
  }

  const changeQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    openSearch();
    onSearchChange?.(nextQuery);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeSearch();
    const trimmedQuery = query.trim();
    if (trimmedQuery) router?.push(`/users/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <form ref={searchRef} onSubmit={handleSubmit} role="search" data-header-search="" data-open={isOpen}
      className="relative w-full min-w-0 max-md:data-[open=true]:absolute max-md:data-[open=true]:inset-x-0 max-md:data-[open=true]:top-0 max-md:data-[open=true]:z-50 max-md:data-[open=true]:flex max-md:data-[open=true]:h-16 max-md:data-[open=true]:items-center max-md:data-[open=true]:border-b max-md:data-[open=true]:border-border max-md:data-[open=true]:bg-black max-md:data-[open=true]:px-4"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) closeSearch(); }}>
      <div className="relative w-full min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input type="search" placeholder="Search" value={query} onChange={(event) => changeQuery(event.target.value)}
        onFocus={openSearch} aria-label="Search" aria-controls={isDropdownVisible ? dropdownId : undefined}
        autoComplete="off"
        className="h-10 w-full min-w-0 rounded-full border border-input bg-surface pl-10 pr-10 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring sm:text-sm md:h-12 [&::-webkit-search-cancel-button]:appearance-none" />
      {query.length > 0 ? (
        <button type="button" aria-label="Clear header search" onClick={() => changeQuery("")}
          className="absolute right-4 top-1/2 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded-full bg-muted-foreground text-surface hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <CloseIcon className="h-2.5 w-2.5" />
        </button>
      ) : undefined}
      </div>
      {isOpen ? (
        <button type="button" aria-label="Close search" onClick={closeSearch}
          className="ml-4 shrink-0 rounded text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden">
          <CloseIcon className="h-6 w-6" />
        </button>
      ) : undefined}
      {isDropdownVisible ? <SearchDropdown id={dropdownId} query={query} search={search} onSelect={closeSearch} /> : undefined}
    </form>
  );
}
