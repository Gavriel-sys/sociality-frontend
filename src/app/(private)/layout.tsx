"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildLoginHref } from "@/lib/session";
import { useSessionSnapshot } from "@/lib/use-session";

export default function PrivateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSessionSnapshot();

  useEffect(() => {
    if (session.mounted && !session.isLoggedIn) {
      router.replace(buildLoginHref(pathname));
    }
  }, [pathname, router, session.isLoggedIn, session.mounted]);

  if (!session.mounted || !session.isLoggedIn) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] px-8 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <p className="text-lg font-medium text-white">Menyiapkan sesi kamu...</p>
          <p className="mt-2 text-sm text-white/55">
            Kalau belum login, kamu akan diarahkan ke halaman masuk.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
