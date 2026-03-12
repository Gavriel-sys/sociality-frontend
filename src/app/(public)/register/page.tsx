"use client";

import axios from "axios";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { register } from "@/lib/social-api";
import { persistUserSnapshot, setToken, getToken } from "@/lib/session";
import { Brand } from "@/components/brand-mark";
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black p-6 text-white">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nextPath = searchParams.get("next") || "/feed";

  useEffect(() => {
    if (getToken()) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setFormError("Nama wajib diisi");
      return;
    }

    if (!username.trim()) {
      setFormError("Username wajib diisi");
      return;
    }

    if (!email.trim()) {
      setFormError("Email wajib diisi");
      return;
    }

    if (!phone.trim()) {
      setFormError("Nomor HP wajib diisi");
      return;
    }

    if (!password.trim()) {
      setFormError("Password wajib diisi");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Konfirmasi password belum sama");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const data = await register({
        name,
        username,
        phone,
        email,
        password,
      });

      setToken(data.token);
      persistUserSnapshot(data.user);
      router.push(nextPath);
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, "Registrasi gagal"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(109,40,217,0.8),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.72),transparent_40%),linear-gradient(180deg,#000000_0%,#02020b_54%,#130322_100%)]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-[430px] rounded-[18px] border border-white/10 bg-black/45 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-md sm:px-8">
          <div className="mb-8 flex justify-center">
            <Brand titleClassName="text-[2.05rem] leading-none" />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-3xl font-semibold text-white">Register</h1>
          </div>

          {formError ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Name</label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 rounded-xl border-white/10 bg-[#050b16] text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Username</label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-12 rounded-xl border-white/10 bg-[#050b16] text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-xl border-white/10 bg-[#050b16] text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Number Phone</label>
              <Input
                type="text"
                placeholder="Enter your number phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-12 rounded-xl border-white/10 bg-[#050b16] text-white placeholder:text-white/30"
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
                  className="h-12 rounded-xl border-white/10 bg-[#050b16] pr-11 text-white placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-[#050b16] pr-11 text-white placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-base font-semibold text-white hover:from-violet-500 hover:to-purple-400"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/72">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

