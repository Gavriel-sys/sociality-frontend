"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, MessageCircle, Search, UserRoundPlus } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();
  const hasToken = !!getToken();

  useEffect(() => {
    if (hasToken) {
      router.replace("/feed");
    }
  }, [hasToken, router]);

  if (hasToken) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[40px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">
            Sociality MVP
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Tempat yang ringkas untuk posting, follow, dan ngobrol lewat timeline.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
            Sociality menggabungkan feed pribadi, profile publik, likes, comments,
            saves, dan follow graph dalam alur yang simpel. Login atau register,
            lalu langsung mulai bangun timeline kamu.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-6 text-sm font-semibold text-white"
            >
              Mulai Sekarang
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white"
            >
              Saya Sudah Punya Akun
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <FeatureCard
              icon={<Search className="h-5 w-5" />}
              title="Search & discover"
              text="Cari user, buka profil publik, dan eksplor postingan mereka."
            />
            <FeatureCard
              icon={<Bookmark className="h-5 w-5" />}
              title="Save for later"
              text="Simpan post penting dan buka lagi saat kamu butuh."
            />
            <FeatureCard
              icon={<UserRoundPlus className="h-5 w-5" />}
              title="Follow graph"
              text="Bangun feed personal dengan akun yang benar-benar kamu suka."
            />
          </div>
        </div>

        <div className="space-y-6 rounded-[40px] border border-white/10 bg-[#060915]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/45">Preview before login</p>
              <h2 className="text-2xl font-semibold text-white">Sample timeline card</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/45">
              Demo
            </span>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-black/40">
            <img
              src="/avatars/default-avatar.png"
              alt="preview"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-4">
              <img
                src="/avatars/default-avatar.png"
                alt="avatar"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-white">Johndoe</p>
                <p className="text-sm text-white/45">Baru saja</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/75">
              Layout utama akan mengikuti gaya gelap yang sudah kamu mulai, tapi
              sekarang dengan hirarki konten yang lebih jelas, akses halaman lebih
              lengkap, dan flow user yang utuh dari login sampai interaksi sosial.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/55">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
                <MessageCircle className="h-4 w-4" />
                Comments
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
                <Bookmark className="h-4 w-4" />
                Saved posts
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
                <ArrowRight className="h-4 w-4" />
                Public profiles
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-violet-300">
        {icon}
      </div>
      <p className="font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
    </div>
  );
}
