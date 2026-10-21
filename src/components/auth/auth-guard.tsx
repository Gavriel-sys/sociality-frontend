"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAppSelector } from "@/lib/store/hooks";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      const currentPath = resolveCurrentPath(pathname, searchParams);
      const target = `/login?returnTo=${encodeURIComponent(currentPath)}`;
      router.push(target);
    }
  }, [status, pathname, searchParams, router]);

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return <>{fallback ?? <LoadingState message="Verifying session..." />}</>;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const defaultFallback = fallback ?? <LoadingState message="Verifying session..." />;

  return (
    <Suspense fallback={defaultFallback}>
      <AuthGuardContent fallback={fallback}>{children}</AuthGuardContent>
    </Suspense>
  );
}
