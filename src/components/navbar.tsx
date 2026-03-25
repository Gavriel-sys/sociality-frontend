"use client";

import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/lib/social-api";
import { getLocalAvatar } from "@/lib/local-avatar";
import { clearSession } from "@/lib/session";
import { useSessionSnapshot } from "@/lib/use-session";
import { Brand } from "@/components/brand-mark";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

const getAvatar = (url?: string | null) => {
  if (!url || url === "null" || url.trim() === "") return DEFAULT_AVATAR;
  return url;
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSessionSnapshot();
  const isLoggedIn = session.isLoggedIn;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const showSearch = isLoggedIn || pathname === "/";

  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!session.mounted) {
      return;
    }

    let active = true;

    getLocalAvatar()
      .then((localAvatar) => {
        if (active) {
          setLocalAvatarUrl(localAvatar);
        }
      })
      .catch(() => {
        if (active) {
          setLocalAvatarUrl(null);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname, session.mounted]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchValue.trim());
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchValue]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const searchQuery = useQuery({
    queryKey: ["navbar-search", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery, { page: 1, limit: 6 }),
    enabled: session.mounted && isLoggedIn && debouncedQuery.length > 0,
  });

  if (isAuthPage) {
    return null;
  }

  const avatarUrl = localAvatarUrl || session.avatarUrl || DEFAULT_AVATAR;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchValue.trim();
    setSearchOpen(false);
    router.push(
      query ? `/users/search?q=${encodeURIComponent(query)}` : "/users/search",
    );
  }

  function handleLogout() {
    clearSession();
    router.push("/");
    router.refresh();
  }

  function handleUserClick(username: string) {
    setSearchOpen(false);
    setSearchValue("");
    router.push(`/profile/${username}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-black/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={isLoggedIn ? "/feed" : "/"} className="shrink-0">
          <Brand titleClassName="text-2xl leading-none sm:text-[1.9rem]" />
        </Link>

        {showSearch ? (
          <div
            ref={searchRef}
            className="relative order-3 w-full md:order-none md:mx-auto md:max-w-[390px] md:flex-1 md:px-4"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search"
                className="h-12 w-full rounded-full border border-white/10 bg-[#040a16] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30"
              />
            </form>

            {session.mounted &&
            isLoggedIn &&
            searchOpen &&
            searchValue.trim() ? (
              <div className="absolute z-50 mt-3 w-full overflow-hidden rounded-[18px] border border-white/10 bg-[#040a16]/98 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                {searchQuery.isPending ? (
                  <div className="px-5 py-8 text-center text-sm text-white/55">
                    Searching...
                  </div>
                ) : !searchQuery.data?.users.length ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm font-semibold text-white">
                      No results found
                    </p>
                    <p className="mt-2 text-xs text-white/45">
                      Change your keyword
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {searchQuery.data.users.map((user) => (
                      <button
                        key={`${user.id}-${user.username}`}
                        type="button"
                        onClick={() => handleUserClick(user.username)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
                      >
                        <img
                          src={user.avatarUrl || DEFAULT_AVATAR}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-white/45">
                            @{user.username}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {isLoggedIn ? (
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/me"
              className="flex items-center gap-3 rounded-full px-1 py-1 transition hover:bg-white/[0.03]"
            >
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-11 w-11 rounded-full object-cover"
              />
              <span className="hidden max-w-28 truncate text-sm font-semibold text-white sm:block">
                {session.displayName}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#040a16] text-white/68 transition hover:text-white"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
