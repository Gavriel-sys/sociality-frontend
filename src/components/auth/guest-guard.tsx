"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/feedback/loading-state";
import { getSafeReturnUrl } from "@/features/auth/redirect-utils";
import { useAppSelector } from "@/lib/store/hooks";
import { useIsHydrated } from "./use-is-hydrated";

export interface GuestGuardProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly redirectTo?: string;
}

function GuestGuardContent({
  children,
  fallback,
  redirectTo,
}: GuestGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useAppSelector((state) => state.auth.status);
  const isMounted = useIsHydrated();

  useEffect(() => {
    if (isMounted && status === "authenticated") {
      const returnTo = redirectTo ?? searchParams?.get("returnTo");
      const target = getSafeReturnUrl(returnTo, "/me");
      router.push(target);
    }
  }, [isMounted, status, searchParams, router, redirectTo]);

  if (!isMounted || status === "authenticated") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function GuestGuard({ children, fallback, redirectTo }: GuestGuardProps) {
  const loadingFallback = fallback ?? <LoadingState message="Verifying session..." />;

  return (
    <Suspense fallback={loadingFallback}>
      <GuestGuardContent fallback={loadingFallback} redirectTo={redirectTo}>{children}</GuestGuardContent>
    </Suspense>
  );
}
