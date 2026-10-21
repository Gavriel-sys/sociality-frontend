"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import type { LoginInput } from "@/features/auth/schemas";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleLogin = async (data: LoginInput) => {
    void data;
    setIsLoading(true);
    setServerError(null);
    try {
      // Pure local demo simulation without external network requests
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {/* Brand mark & title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7F51F9] to-[#6936F2] shadow-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 32 32"
              fill="none"
              className="text-[#FDFDFD]"
              aria-hidden="true"
            >
              <path
                d="M22 11C20.5 9.5 18 9 16 9C12.5 9 10 11.2 10 14C10 18.5 22 16.5 22 20.5C22 23 19.5 24 16 24C13.5 24 11.2 23 9.8 21.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#FDFDFD]">Sociality</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#FDFDFD]">Sign in</h1>
          <p className="text-sm text-[#A4A7AE]">Welcome back! Please enter your details.</p>
        </div>
      </div>

      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        serverError={serverError}
      />

      <p className="text-center text-sm text-[#A4A7AE]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-[#7F51F9] underline-offset-4 hover:underline hover:text-[#9B76FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F51F9] rounded transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
