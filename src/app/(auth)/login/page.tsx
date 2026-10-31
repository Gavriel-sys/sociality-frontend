"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { GuestGuard } from "@/components/auth/guest-guard";
import { setSession } from "@/features/auth/auth-slice";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSafeReturnUrl } from "@/features/auth/redirect-utils";
import type { LoginInput } from "@/features/auth/schemas";
import { saveSession } from "@/features/auth/session-storage";
import type { AuthUser, SessionData } from "@/features/auth/types";
import { ApiHttpError } from "@/lib/api/api-errors";
import { apiFetch } from "@/lib/api/api-fetch";
import { useAppDispatch } from "@/lib/store/hooks";

type LoginResponse = {
  readonly success: true;
  readonly message: string;
  readonly data: { readonly token: string; readonly user: AuthUser };
} | { readonly success: false; readonly message: string };

async function loginAccount(credentials: LoginInput): Promise<SessionData> {
  const response = await apiFetch<LoginResponse>({
    endpoint: "/api/auth/login",
    method: "POST",
    body: { email: credentials.email.trim(), password: credentials.password },
  });
  if (!response.success) throw new Error(response.message);
  return { ...response.data, sessionId: crypto.randomUUID() };
}

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiHttpError) {
    const response = error.data;
    if (typeof response === "object" && response !== null && "message" in response
      && typeof response.message === "string" && response.message.trim()) {
      return response.message;
    }
  }
  return error instanceof Error ? error.message : "Login failed. Please try again.";
}

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isLoggingIn = useRef(false);
  const [serverError, setServerError] = useState<string>();
  const returnUrl = getSafeReturnUrl(searchParams.get("returnTo"), "/feed");

  async function handleLogin(credentials: LoginInput): Promise<void> {
    if (isLoggingIn.current) return;
    isLoggingIn.current = true;
    setServerError(undefined);
    try {
      const session = await loginAccount(credentials);
      dispatch(setSession(session));
      saveSession(session);
      router.push(returnUrl);
    } catch (error) {
      setServerError(getLoginErrorMessage(error));
    } finally {
      isLoggingIn.current = false;
    }
  }

  return (
    <GuestGuard redirectTo={returnUrl}>
      <div className="flex flex-col items-center gap-4 md:gap-6">
        <div className="flex items-center gap-[11px] text-2xl leading-9 font-bold text-foreground">
          <Image src="/images/auth/sociality-starburst.svg" width={30} height={30} alt="" />
          <span>Sociality</span>
        </div>
        <h1 className="text-center text-2xl leading-9 font-bold text-foreground">Log in</h1>
        <LoginForm onSubmit={handleLogin} serverError={serverError} />
      </div>
    </GuestGuard>
  );
}

export default function LoginPage() {
  return <Suspense><LoginView /></Suspense>;
}
