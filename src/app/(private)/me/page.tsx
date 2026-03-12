"use client";

import Link from "next/link";
import { Bookmark, LayoutGrid, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, fetchMySaved, fetchUserPosts } from "@/lib/social-api";
import { persistUserSnapshot } from "@/lib/session";
import { getLocalAvatar } from "@/lib/local-avatar";
import { EmptyState } from "@/components/empty-state";
import { formatCount } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

export default function MePage() {
  const [localAvatarOverride, setLocalAvatarOverride] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"gallery" | "saved">("gallery");
  const [copied, setCopied] = useState(false);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const username = meQuery.data?.profile.username ?? "";

  const postsQuery = useQuery({
    queryKey: ["my-profile-posts", username],
    queryFn: () => fetchUserPosts(username, { page: 1, limit: 12 }),
    enabled: !!username,
  });

  const savedQuery = useQuery({
    queryKey: ["my-profile-saved"],
    queryFn: () => fetchMySaved({ page: 1, limit: 12 }),
  });

  useEffect(() => {
    if (!meQuery.data) {
      return;
    }

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
  const galleryItems = postsQuery.data?.posts ?? [];
  const savedItems = savedQuery.data?.posts ?? [];
  const currentItems = activeTab === "gallery" ? galleryItems : savedItems;
  const isLoadingCurrentTab = activeTab === "gallery" ? postsQuery.isPending : savedQuery.isPending;

  async function handleShareProfile() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 pb-28 pt-10 sm:px-6 lg:px-8">
      <section className="space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <img
              src={avatarSrc}
              alt={profile.name}
              className="h-[72px] w-[72px] rounded-full object-cover sm:h-20 sm:w-20"
            />
            <div>
              <h1 className="text-3xl font-semibold text-white">{profile.name}</h1>
              <p className="mt-2 text-xl text-white/68">{profile.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/me/edit"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white"
            >
              Edit Profile
            </Link>
            <button
              type="button"
              onClick={handleShareProfile}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/[0.03]"
              aria-label="Share profile"
              title={copied ? "Copied" : "Share profile"}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="max-w-4xl text-lg leading-8 text-white/84">
          {profile.bio || "Creating unforgettable moments with every post you share."}
        </p>

        <div className="grid overflow-hidden rounded-[24px] border border-white/10 sm:grid-cols-4">
          <StatLink href="#profile-gallery" label="Post" value={formatCount(stats.posts)} />
          <StatLink href="/me/followers" label="Followers" value={formatCount(stats.followers)} />
          <StatLink href="/me/following" label="Following" value={formatCount(stats.following)} />
          <StatLink href="/me/likes" label="Likes" value={formatCount(stats.likes)} />
        </div>

        <div id="profile-gallery" className="border-b border-white/10">
          <div className="flex items-center gap-8">
            <TabButton
              active={activeTab === "gallery"}
              icon={<LayoutGrid className="h-5 w-5" />}
              label="Gallery"
              onClick={() => setActiveTab("gallery")}
            />
            <TabButton
              active={activeTab === "saved"}
              icon={<Bookmark className="h-5 w-5" />}
              label="Saved"
              onClick={() => setActiveTab("saved")}
            />
          </div>
        </div>

        {isLoadingCurrentTab ? (
          <div className="py-16 text-center text-white/62">Memuat koleksi...</div>
        ) : currentItems.length ? (
          <GalleryGrid items={currentItems} />
        ) : (
          <EmptyState
            title={activeTab === "gallery" ? "Belum ada post" : "Belum ada post tersimpan"}
            description={
              activeTab === "gallery"
                ? "Post pertama kamu akan muncul di sini setelah dipublish."
                : "Post yang kamu simpan akan tampil di tab ini."
            }
            ctaLabel={activeTab === "gallery" ? "Buat Post" : undefined}
            ctaHref={activeTab === "gallery" ? "/posts/create" : undefined}
          />
        )}
      </section>
    </div>
  );
}

function StatLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="border-b border-white/10 px-4 py-5 text-center transition hover:bg-white/[0.02] sm:border-b-0 sm:border-r sm:border-white/10 last:sm:border-r-0"
    >
      <p className="text-4xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xl text-white/58">{label}</p>
    </Link>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: import("react").ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 px-1 py-4 text-lg font-medium transition ${
        active ? "text-white" : "text-white/52"
      }`}
    >
      {icon}
      <span>{label}</span>
      {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white" /> : null}
    </button>
  );
}

function GalleryGrid({
  items,
}: {
  items: { id: number; imageUrl: string | null; caption: string | null }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-[2px] overflow-hidden rounded-[10px] bg-white/10 sm:grid-cols-3">
      {items.map((item) => (
        <Link key={item.id} href={`/posts/${item.id}`} className="block overflow-hidden bg-black">
          <img
            src={item.imageUrl || DEFAULT_AVATAR}
            alt={item.caption || "Post image"}
            className="aspect-square w-full object-cover transition duration-300 hover:scale-[1.02]"
          />
        </Link>
      ))}
    </div>
  );
}

