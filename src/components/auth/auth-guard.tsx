"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAppSelector } from "@/lib/store/hooks";
import { useIsHydrated } from "./use-is-hydrated";

export interface AuthGuardProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

function resolveCurrentPath(
  pathname: string | null,
  searchParams: URLSearchParams | null,
): string {
  const basePath = pathname && pathname.length > 0 ? pathname : "/";
  const search = searchParams?.toString();
  return search && search.length > 0 ? `${basePath}?${search}` : basePath;
}

function AuthGuardContent({
  children,
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = useAppSelector((state) => state.auth.status);
  const isMounted = useIsHydrated();

  useEffect(() => {
    if (isMounted && status === "unauthenticated") {
      const currentPath = resolveCurrentPath(pathname, searchParams);
      const target = `/login?returnTo=${encodeURIComponent(currentPath)}`;
      router.push(target);
    }
  }, [isMounted, status, pathname, searchParams, router]);

  if (isMounted && status === "authenticated") {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const loadingFallback = fallback ?? <LoadingState message="Verifying session..." />;

  return (
    <Suspense fallback={loadingFallback}>
      <AuthGuardContent fallback={loadingFallback}>{children}</AuthGuardContent>
    </Suspense>
  );
}
