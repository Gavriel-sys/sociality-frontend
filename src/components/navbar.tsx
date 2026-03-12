"use client";

import Link from "next/link";
import { Search, Loader2, LogOut } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocalAvatar } from "@/lib/local-avatar";
import {
  clearSession,
  getStoredAvatar,
  getStoredDisplayName,
  getToken,
} from "@/lib/session";
import { Button } from "@/components/ui/button";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = !!getToken();
  const displayName = getStoredDisplayName();

  const [avatarUrl, setAvatarUrl] = useState(() => getStoredAvatar() || DEFAULT_AVATAR);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    getLocalAvatar().then((localAvatar) => {
      setAvatarUrl(localAvatar || getStoredAvatar() || DEFAULT_AVATAR);
    });
  }, [pathname]);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchValue.trim();
    if (!query) {
      router.push("/users/search");
      return;
    }

    router.push(`/users/search?q=${encodeURIComponent(query)}`);
  }

  function handleLogout() {
    clearSession();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={isLoggedIn ? "/feed" : "/"} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Sociality
            </p>
            <p className="hidden text-xs text-white/45 sm:block">
              Share, connect, and keep the timeline moving.
            </p>
          </div>
        </Link>

        <form onSubmit={handleSearchSubmit} className="relative ml-auto hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Cari orang atau username"
            className="h-12 w-full rounded-full border border-white/10 bg-[#050b16] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35"
          />
        </form>

        {isLoggedIn ? (
          <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="hidden h-11 rounded-full border-white/10 bg-white/[0.03] px-4 text-white md:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>

            <Link
              href="/me"
              className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-2 py-2"
            >
              <img
                src={avatarUrl || DEFAULT_AVATAR}
                alt="avatar"
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="hidden max-w-28 truncate font-semibold text-white sm:block">
                {displayName}
              </span>
            </Link>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white sm:px-8"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-full bg-violet-600 px-6 text-sm font-semibold text-white sm:px-8"
            >
              Register
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
