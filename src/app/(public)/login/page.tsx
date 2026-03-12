"use client";

import axios from "axios";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/lib/social-api";
import { persistUserSnapshot, setToken, getToken } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black p-6 text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const nextPath = searchParams.get("next") || "/feed";
  const registered = useMemo(
    () => searchParams.get("registered") === "1",
    [searchParams],
  );

  useEffect(() => {
    if (getToken()) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

      const data = await login({
        email,
        password,
      });

      setToken(data.token);
      persistUserSnapshot(data.user);
      router.push(nextPath);
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, "Login gagal"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,56,255,0.45),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.35),transparent_24%),linear-gradient(to_bottom,#000000,#04020a,#090114)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_480px]">
          <div className="hidden rounded-[40px] border border-white/10 bg-white/[0.03] p-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">
              Welcome Back
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">
              Lanjutkan percakapan, bukan cuma buka aplikasi.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/65">
              Masuk untuk melihat feed personal, menyimpan post, memberi like,
              menulis komentar, dan mengelola profile kamu dari satu tempat.
            </p>
          </div>

          <div className="w-full rounded-[36px] border border-white/10 bg-black/45 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
            <div className="mb-8 flex items-center gap-3 text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-3xl font-semibold tracking-tight">Sociality</span>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white">Masuk ke akun kamu</h2>
              <p className="mt-2 text-sm text-white/55">
                Akses feed, likes, saved posts, dan profile settings kamu.
              </p>
            </div>

            {registered ? (
              <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                Registrasi berhasil. Silakan login.
              </div>
            ) : null}

            {formError ? (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {formError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 rounded-2xl border-white/10 bg-[#050b16] text-white placeholder:text-white/35"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl border-white/10 bg-[#050b16] pr-11 text-white placeholder:text-white/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45"
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

            <p className="mt-6 text-center text-sm text-white/65">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-violet-400 hover:text-violet-300">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
