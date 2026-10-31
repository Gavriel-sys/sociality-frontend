"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { GuestGuard } from "@/components/auth/guest-guard";
import { setSession } from "@/features/auth/auth-slice";
import { RegisterForm } from "@/features/auth/components/register-form";
import type { RegisterInput } from "@/features/auth/schemas";
import { saveSession } from "@/features/auth/session-storage";
import type { AuthUser, SessionData } from "@/features/auth/types";
import { ApiHttpError } from "@/lib/api/api-errors";
import { apiFetch } from "@/lib/api/api-fetch";
import { useAppDispatch } from "@/lib/store/hooks";

type RegistrationResponse = {
  readonly success: true;
  readonly message: string;
  readonly data: { readonly token: string; readonly user: AuthUser };
} | { readonly success: false; readonly message: string };

async function registerAccount(registration: RegisterInput): Promise<SessionData> {
  const response = await apiFetch<RegistrationResponse>({
    endpoint: "/api/auth/register",
    method: "POST",
    body: {
      name: registration.name.trim(),
      username: registration.username.trim(),
      email: registration.email.trim(),
      password: registration.password,
      phone: registration.phone?.trim() || undefined,
    },
  });
  if (!response.success) throw new Error(response.message);
  return { ...response.data, sessionId: crypto.randomUUID() };
}

function getRegistrationErrorMessage(error: unknown): string {
  if (error instanceof ApiHttpError) {
    const response = error.data;
    if (typeof response === "object" && response !== null && "message" in response
      && typeof response.message === "string" && response.message.trim()) {
      return response.message;
    }
  }
  return error instanceof Error ? error.message : "Registration failed. Please try again.";
}

function RegisterView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isRegistering = useRef(false);
  const [serverError, setServerError] = useState<string>();

  async function handleRegister(registration: RegisterInput): Promise<void> {
    if (isRegistering.current) return;
    isRegistering.current = true;
    setServerError(undefined);
    try {
      const session = await registerAccount(registration);
      dispatch(setSession(session));
      saveSession(session);
      router.push("/feed");
    } catch (error) {
      setServerError(getRegistrationErrorMessage(error));
    } finally {
      isRegistering.current = false;
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 md:gap-6">
      <div className="flex items-center gap-[11px] text-2xl leading-9 font-bold text-foreground">
        <Image src="/images/auth/sociality-starburst.svg" width={30} height={30} alt="" />
        <span>Sociality</span>
      </div>
      <h1 className="text-center text-2xl leading-9 font-bold text-foreground">Register</h1>
      <RegisterForm onSubmit={handleRegister} serverError={serverError} />
    </div>
  );
}

export default function RegisterPage() {
  return <GuestGuard redirectTo="/feed"><RegisterView /></GuestGuard>;
}
