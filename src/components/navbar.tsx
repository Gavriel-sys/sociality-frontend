"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
  <rect width="120" height="120" rx="60" fill="#0F172A"/>
  <circle cx="60" cy="46" r="20" fill="#475569"/>
  <path d="M24 102c6-18 21-29 36-29s30 11 36 29" fill="#475569"/>
</svg>
`)}`;

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const cachedName = localStorage.getItem("me_username");
    const cachedAvatar = localStorage.getItem("me_avatar");

    if (cachedName) setUsername(cachedName);
    if (cachedAvatar) setAvatarUrl(cachedAvatar);
  }, [pathname]);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("me_username");
    localStorage.removeItem("me_avatar");
    setIsLoggedIn(false);
    router.push("/login");
  }

  return (
    <header className="border-b border-white/10 bg-black">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href={isLoggedIn ? "/feed" : "/"}
          className="text-2xl font-semibold"
        >
          Sociality
        </Link>

        {isLoggedIn && (
          <>
            <div className="relative hidden w-full max-w-md md:block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                placeholder="Search"
                className="h-11 w-full rounded-full border border-white/10 bg-[#050b16] pl-11 pr-4 text-sm text-white outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <Link href="/me" className="flex items-center gap-3">
                <img
                  src={avatarUrl || DEFAULT_AVATAR}
                  alt="avatar"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="hidden font-medium md:block">{username}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
