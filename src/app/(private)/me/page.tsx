"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bookmark, Heart, PencilLine, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, fetchMyLikes, fetchMySaved, fetchUserPosts } from "@/lib/social-api";
import { persistUserSnapshot } from "@/lib/session";
import { getLocalAvatar } from "@/lib/local-avatar";
import { EmptyState } from "@/components/empty-state";
import { PageShell, Surface } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

export default function MePage() {
  const [localAvatarOverride, setLocalAvatarOverride] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const username = meQuery.data?.profile.username ?? "";

  const postsQuery = useQuery({
    queryKey: ["my-posts-preview", username],
    queryFn: () => fetchUserPosts(username, { page: 1, limit: 6 }),
    enabled: !!username,
  });

  const likedQuery = useQuery({
    queryKey: ["my-liked-preview"],
    queryFn: () => fetchMyLikes({ page: 1, limit: 4 }),
  });

  const savedQuery = useQuery({
    queryKey: ["my-saved-preview"],
    queryFn: () => fetchMySaved({ page: 1, limit: 4 }),
  });

  useEffect(() => {
    if (!meQuery.data) return;

    persistUserSnapshot({
      name: meQuery.data.profile.name,
      username: meQuery.data.profile.username,
      avatarUrl: meQuery.data.profile.avatarUrl,
    });

    getLocalAvatar().then((localAvatar) => {
      if (localAvatar) {
        setLocalAvatarOverride(localAvatar);
      }
    });
  }, [meQuery.data]);

  if (meQuery.isPending) {
    return <div className="p-6 text-white">Loading profile...</div>;
  }

  if (meQuery.error || !meQuery.data) {
    return <div className="p-6 text-white">Gagal mengambil profile</div>;
  }

  const { profile, stats } = meQuery.data;
  const avatarSrc = localAvatarOverride || profile.avatarUrl || DEFAULT_AVATAR;

  return (
    <PageShell
      eyebrow="My space"
      title={profile.name}
      description={profile.bio || "Lengkapi bio kamu dari halaman edit profile agar profil terasa lebih hidup."}
      actions={
        <Button asChild className="h-12 rounded-full px-6">
          <Link href="/me/edit">Edit Profile</Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={avatarSrc}
              alt={profile.name}
              className="h-28 w-28 rounded-full object-cover ring-1 ring-white/10"
            />

            <div className="flex-1">
              <p className="text-sm text-white/45">@{profile.username}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Posts" value={formatCount(stats.posts)} href="#posts" />
                <StatCard label="Followers" value={formatCount(stats.followers)} href="/me/followers" />
                <StatCard label="Following" value={formatCount(stats.following)} href="/me/following" />
                <StatCard label="Likes" value={formatCount(stats.likes)} href="/me/likes" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <QuickLink href="/me/edit" title="Update profile" subtitle="Nama, bio, phone, dan avatar lokal" icon={<PencilLine className="h-5 w-5" />} />
            <QuickLink href="/me/saved" title="Saved posts" subtitle="Buka lagi konten yang kamu simpan" icon={<Bookmark className="h-5 w-5" />} />
            <QuickLink href="/me/likes" title="Liked posts" subtitle="Lacak semua post yang pernah kamu like" icon={<Heart className="h-5 w-5" />} />
          </div>
        </Surface>

        <Surface className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-violet-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Network snapshot</p>
              <p className="text-sm text-white/55">Akses cepat ke followers dan following.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/me/followers" className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/45">Followers</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.followers}</p>
            </Link>
            <Link href="/me/following" className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/45">Following</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.following}</p>
            </Link>
          </div>
        </Surface>
      </div>

      <div id="posts" className="grid gap-6 lg:grid-cols-3">
        <Surface className="lg:col-span-2">
          <SectionHeader title="Recent posts" href="/posts/create" hrefLabel="Create new" />
          {postsQuery.data?.posts.length ? (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              {postsQuery.data.posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                  <img src={post.imageUrl || DEFAULT_AVATAR} alt={post.caption || "Post image"} className="aspect-square w-full object-cover" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Belum ada post"
                description="Post pertama kamu akan tampil di sini setelah dipublish."
                ctaLabel="Buat Post"
                ctaHref="/posts/create"
              />
            </div>
          )}
        </Surface>

        <div className="space-y-6">
          <Surface>
            <SectionHeader title="Saved" href="/me/saved" hrefLabel="Open all" />
            <MiniPostList
              items={savedQuery.data?.posts ?? []}
              emptyText="Belum ada post yang kamu simpan."
            />
          </Surface>

          <Surface>
            <SectionHeader title="Likes" href="/me/likes" hrefLabel="Open all" />
            <MiniPostList
              items={likedQuery.data?.posts ?? []}
              emptyText="Belum ada post yang kamu like."
            />
          </Surface>
        </div>
      </div>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="rounded-[24px] border border-white/10 bg-black/20 p-4 transition hover:border-white/20">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-violet-300">
        {icon}
      </div>
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/55">{subtitle}</p>
    </Link>
  );
}

function SectionHeader({
  title,
  href,
  hrefLabel,
}: {
  title: string;
  href: string;
  hrefLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <Link href={href} className="text-sm font-medium text-violet-300">
        {hrefLabel}
      </Link>
    </div>
  );
}

function MiniPostList({
  items,
  emptyText,
}: {
  items: { id: number; imageUrl: string | null; caption: string | null }[];
  emptyText: string;
}) {
  if (!items.length) {
    return <p className="mt-4 text-sm leading-6 text-white/55">{emptyText}</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <Link key={item.id} href={`/posts/${item.id}`} className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-black/20 p-3">
          <img src={item.imageUrl || DEFAULT_AVATAR} alt={item.caption || "Post image"} className="h-16 w-16 rounded-2xl object-cover" />
          <p className="line-clamp-2 text-sm leading-6 text-white/72">{item.caption || "Tanpa caption"}</p>
        </Link>
      ))}
    </div>
  );
}
