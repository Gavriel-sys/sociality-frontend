"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeReturnUrl } from "@/features/auth/redirect-utils";
import { useAppSelector } from "@/lib/store/hooks";

export interface GuestGuardProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

function GuestGuardContent({
  children,
  fallback = null,
}: GuestGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status === "authenticated") {
      const returnTo = searchParams?.get("returnTo");
      const target = getSafeReturnUrl(returnTo, "/me");
      router.push(target);
    }
  }, [status, searchParams, router]);

  if (status === "authenticated") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function GuestGuard({ children, fallback }: GuestGuardProps) {
  return (
    <Suspense fallback={fallback ?? null}>
      <GuestGuardContent fallback={fallback}>{children}</GuestGuardContent>
    </Suspense>
  );
}
