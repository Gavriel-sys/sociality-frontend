"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Home, Plus, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { getToken } from "@/lib/session";

export function FloatingNav() {
  const pathname = usePathname();
  const isLoggedIn = !!getToken();

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const homeHref = isLoggedIn ? "/feed" : "/";
  const createHref = isLoggedIn ? "/posts/create" : "/login?next=%2Fposts%2Fcreate";
  const profileHref = isLoggedIn ? "/me" : "/login?next=%2Fme";

  const isHomeActive = pathname === "/" || pathname === "/feed";
  const isSearchActive = pathname === "/users/search";
  const isCreateActive = pathname === "/posts/create";
  const isProfileActive = pathname === "/me" || pathname.startsWith("/me/");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1020]/92 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <NavItem href={homeHref} active={isHomeActive} label="Home" icon={<Home className="h-5 w-5" />} />
        <NavItem href="/users/search" active={isSearchActive} label="Search" icon={<Search className="h-5 w-5" />} />
        <Link
          href={createHref}
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isCreateActive ? "bg-violet-500 text-white" : "bg-violet-600 text-white"
          }`}
        >
          <Plus className="h-6 w-6" />
        </Link>
        <NavItem href={profileHref} active={isProfileActive} label="Profile" icon={<User className="h-5 w-5" />} />
      </div>
    </div>
  );
}

function NavItem({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-20 flex-col items-center gap-1 rounded-full px-3 py-2 text-xs ${
        active ? "text-violet-400" : "text-white/75"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
