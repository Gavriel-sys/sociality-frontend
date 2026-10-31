"use client";

import { useContext } from "react";
import type { HTMLAttributes } from "react";
import Image from "next/image";
import Link from "next/link";
import { ReactReduxContext } from "react-redux";
import { useIsHydrated } from "@/components/auth/use-is-hydrated";
import { Avatar } from "@/components/ui/avatar";
import { useMyProfile } from "@/features/profile/use-my-profile";
import { useAppSelector } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { HeaderSearch } from "./header-search";

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  readonly searchValue?: string;
  readonly onSearchChange?: (value: string) => void;
  readonly userAvatarSrc?: string;
  readonly userFallback?: string;
}

interface HeaderAuthProps {
  readonly userAvatarSrc?: string;
  readonly userFallback?: string;
}

function AvatarLink({ userAvatarSrc, userFallback }: HeaderAuthProps) {
  return (
    <Link
      href="/me"
      aria-label="View your profile"
      className="inline-flex rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9]"
    >
      <Avatar src={userAvatarSrc} fallback={userFallback} size="md" alt="Current user profile" />
    </Link>
  );
}

function GuestAuthLinks() {
  return (
    <div className="flex items-center gap-2.5">
      <Link href="/login" className="rounded-full border border-[#1F242F] bg-[#0A0D12] px-4 py-1.5 text-sm font-medium text-[#FDFDFD] transition-colors hover:border-[#373A41]">
        Login
      </Link>
      <Link href="/register" className="rounded-full bg-[#6936F2] px-4 py-1.5 text-sm font-semibold text-[#FDFDFD] transition-colors hover:bg-[#7F51F9]">
        Register
      </Link>
    </div>
  );
}

function ConnectedHeaderAuth(props: HeaderAuthProps) {
  const isHydrated = useIsHydrated();
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = isHydrated && status === "authenticated";
  return isAuthenticated ? <CurrentAccountAvatar {...props} /> : <GuestAuthLinks />;
}

function CurrentAccountAvatar({ userAvatarSrc, userFallback }: HeaderAuthProps) {
  const user = useAppSelector((state) => state.auth.user);
  const { profile } = useMyProfile();
  return (
    <AvatarLink
      userAvatarSrc={userAvatarSrc ?? profile?.avatarUrl ?? user?.avatarUrl}
      userFallback={userFallback ?? profile?.name ?? user?.name ?? user?.username}
    />
  );
}

function HeaderAuth(props: HeaderAuthProps) {
  const reduxContext = useContext(ReactReduxContext);
  return reduxContext ? <ConnectedHeaderAuth {...props} /> : <GuestAuthLinks />;
}

export function Header({
  searchValue = "",
  onSearchChange,
  userAvatarSrc,
  userFallback,
  className,
  ...props
}: Readonly<HeaderProps>) {
  return (
    <header
      role="banner"
      aria-label="Site header"
      className={cn(
        "sticky top-0 z-40 w-full border-b border-[#1F242F] bg-black/90 backdrop-blur-md h-16 md:h-20 transition-all max-md:has-[form[data-open=true]]:z-[60]",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Image src="/images/auth/sociality-starburst.svg" width={28} height={28} alt="" />
          <span className="hidden sm:inline text-lg font-bold tracking-tight text-[#FDFDFD]">Sociality</span>
        </div>

        <div className="flex flex-1 min-w-0 max-w-[491px] items-center lg:absolute lg:left-1/2 lg:w-[491px] lg:-translate-x-1/2">
          <HeaderSearch searchValue={searchValue} onSearchChange={onSearchChange} />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <HeaderAuth userAvatarSrc={userAvatarSrc} userFallback={userFallback} />
        </div>
      </div>
    </header>
  );
}
