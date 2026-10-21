"use client";

import { useContext } from "react";
import type { HTMLAttributes } from "react";
import Link from "next/link";
import { ReactReduxContext } from "react-redux";
import { Avatar } from "@/components/ui/avatar";
import { SearchIcon } from "@/components/ui/icons";
import { useAppSelector } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  readonly searchValue?: string;
  readonly onSearchChange?: (value: string) => void;
  readonly userAvatarSrc?: string;
  readonly userFallback?: string;
  readonly isAuthenticated?: boolean;
}

interface AvatarLinkProps {
  readonly isAuthenticated: boolean;
  readonly userAvatarSrc?: string;
  readonly userFallback?: string;
}

function AvatarLink({ isAuthenticated, userAvatarSrc, userFallback }: AvatarLinkProps) {
  const href = isAuthenticated ? "/me" : "/login";
  const label = isAuthenticated ? "View your profile" : "Log in to your account";
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
    >
      <Avatar src={userAvatarSrc} fallback={userFallback} size="md" alt="Current user profile" />
    </Link>
  );
}

function ConnectedAvatarLink({ userAvatarSrc, userFallback }: Omit<AvatarLinkProps, "isAuthenticated">) {
  const isAuthenticated = useAppSelector((state) => state.auth.status === "authenticated");
  return <AvatarLink isAuthenticated={isAuthenticated} userAvatarSrc={userAvatarSrc} userFallback={userFallback} />;
}

function HeaderAvatarLink({ userAvatarSrc, userFallback, isAuthenticated }: HeaderProps) {
  const reduxContext = useContext(ReactReduxContext);
  if (isAuthenticated !== undefined) {
    return <AvatarLink isAuthenticated={isAuthenticated} userAvatarSrc={userAvatarSrc} userFallback={userFallback} />;
  }
  if (!reduxContext) {
    return <AvatarLink isAuthenticated={false} userAvatarSrc={userAvatarSrc} userFallback={userFallback} />;
  }
  return <ConnectedAvatarLink userAvatarSrc={userAvatarSrc} userFallback={userFallback} />;
}

export function Header({
  searchValue = "",
  onSearchChange,
  userAvatarSrc,
  userFallback = "JD",
  isAuthenticated,
  className,
  ...props
}: Readonly<HeaderProps>) {
  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-40 w-full border-b border-[#1F242F] bg-black/90 backdrop-blur-md h-16 md:h-20 transition-all",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7F51F9] to-[#6936F2] shadow-sm">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="text-[#FDFDFD]" aria-hidden="true">
              <path d="M22 11C20.5 9.5 18 9 16 9C12.5 9 10 11.2 10 14C10 18.5 22 16.5 22 20.5C22 23 19.5 24 16 24C13.5 24 11.2 23 9.8 21.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#FDFDFD]">Sociality</span>
        </div>

        <div className="flex flex-1 max-w-md items-center">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A4A7AE]" />
            <input
              type="search"
              placeholder="Search creators, posts..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              aria-label="Search"
              className="h-10 w-full rounded-full border border-[#1F242F] bg-[#0A0D12] pl-10 pr-4 text-xs sm:text-sm text-[#FDFDFD] placeholder-[#A4A7AE]/60 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <HeaderAvatarLink userAvatarSrc={userAvatarSrc} userFallback={userFallback} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </header>
  );
}
