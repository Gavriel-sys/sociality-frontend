"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api, unwrapResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  token: string;
};

type ErrorResponse = {
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const registered = useMemo(
    () => searchParams.get("registered") === "1",
    [searchParams],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/feed");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      setFormError("Email wajib diisi");
      return;
    }

    if (!password.trim()) {
      setFormError("Password wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const data = unwrapResponse<LoginResponse>(res);
      localStorage.setItem("token", data.token);

      router.push("/feed");
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, "Login gagal"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,56,255,0.85),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.8),transparent_30%),linear-gradient(to_bottom,#000000,#060010,#120022)]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/50 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-8 flex items-center justify-center gap-2 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-3xl font-semibold tracking-tight">
              Sociality
            </span>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
          </div>

          {registered && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              Registrasi berhasil. Silakan login.
            </div>
          )}

          {formError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-white/10 bg-[#050b16] text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-white/10 bg-[#050b16] pr-11 text-white placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-base font-semibold text-white hover:from-violet-500 hover:to-purple-400"
            >
              {submitting ? "Login..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-violet-400 hover:text-violet-300"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
