import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/ui/avatar";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  readonly searchValue?: string;
  readonly onSearchChange?: (value: string) => void;
  readonly userAvatarSrc?: string;
  readonly userFallback?: string;
}

export function Header({
  searchValue = "",
  onSearchChange,
  userAvatarSrc,
  userFallback = "JD",
  className,
  ...props
}: Readonly<HeaderProps>) {
  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-40 w-full border-b border-[#1F242F] bg-black/90 backdrop-blur-md",
        "h-16 md:h-20 transition-all duration-200",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand logo & mark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7F51F9] to-[#6936F2] shadow-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 32 32"
              fill="none"
              className="text-[#FDFDFD]"
              aria-hidden="true"
            >
              <path
                d="M22 11C20.5 9.5 18 9 16 9C12.5 9 10 11.2 10 14C10 18.5 22 16.5 22 20.5C22 23 19.5 24 16 24C13.5 24 11.2 23 9.8 21.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#FDFDFD]">Sociality</span>
        </div>

        {/* Search bar placeholder / control */}
        <div className="flex flex-1 max-w-md items-center">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A4A7AE]" />
            <input
              type="search"
              placeholder="Search creators, posts..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              aria-label="Search"
              className={cn(
                "h-10 w-full rounded-full border border-[#1F242F] bg-[#0A0D12] pl-10 pr-4 text-xs sm:text-sm text-[#FDFDFD] placeholder-[#A4A7AE]/60",
                "outline-none transition-colors focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#7F51F9]",
              )}
            />
          </div>
        </div>

        {/* User avatar indicator */}
        <div className="flex items-center gap-3">
          <Avatar
            src={userAvatarSrc}
            fallback={userFallback}
            size="md"
            className="cursor-pointer transition-transform hover:scale-105"
            alt="Current user profile"
          />
        </div>
      </div>
    </header>
  );
}
