"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Home, Plus, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { buildLoginHref } from "@/lib/session";
import { useSessionSnapshot } from "@/lib/use-session";

export function FloatingNav() {
  const pathname = usePathname();
  const session = useSessionSnapshot();
  const isLoggedIn = session.isLoggedIn;
  const isPublicHome = !isLoggedIn && pathname === "/";

  if ((!isLoggedIn && !isPublicHome) || pathname === "/login" || pathname === "/register") {
    return null;
  }

  if (pathname.startsWith("/posts/") || pathname === "/me/edit") {
    return null;
  }

  const homeHref = isLoggedIn ? "/feed" : "/";
  const createHref = isLoggedIn ? "/posts/create" : buildLoginHref("/posts/create");
  const profileHref = isLoggedIn ? "/me" : buildLoginHref("/me");
  const isHomeActive = pathname === "/" || pathname === "/feed" || pathname === "/users/search";
  const isProfileActive =
    isLoggedIn && (pathname === "/me" || pathname.startsWith("/me/") || pathname.startsWith("/profile/"));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#050b16]/96 px-3 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <NavItem href={homeHref} active={isHomeActive} label="Home" icon={<Home className="h-5 w-5" />} />

        <Link
          href={createHref}
          className="mx-1 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-[0_12px_30px_rgba(123,74,255,0.45)]"
          aria-label="Create post"
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
      className={`flex min-w-[98px] flex-col items-center gap-1 rounded-full px-4 py-2 text-sm transition ${
        active ? "text-violet-400" : "text-white/72"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
