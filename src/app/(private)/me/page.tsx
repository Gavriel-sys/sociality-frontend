"use client";

import Link from "next/link";
import { Bookmark, Grid2x2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, authHeaders, unwrapResponse } from "@/lib/api";
import type { MeData, PostItem } from "@/types/social";

type SavedPostsResponse =
  | PostItem[]
  | {
      items?: PostItem[];
    };

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
  <rect width="160" height="160" rx="80" fill="#0F172A"/>
  <circle cx="80" cy="62" r="28" fill="#475569"/>
  <path d="M32 136c8-24 28-38 48-38s40 14 48 38" fill="#475569"/>
</svg>
`)}`;

function getAvatarSrc(url?: string | null) {
  return url || DEFAULT_AVATAR;
}

async function fetchMe(): Promise<MeData> {
  const res = await api.get("/me", {
    headers: authHeaders(),
  });

  return unwrapResponse<MeData>(res);
}

async function fetchAllPosts(): Promise<PostItem[]> {
  const res = await api.get("/posts", {
    headers: authHeaders(),
  });

  const data = unwrapResponse<PostItem[] | { items?: PostItem[] }>(res);
  return Array.isArray(data) ? data : (data.items ?? []);
}

async function fetchSavedPosts(username: string): Promise<PostItem[]> {
  const res = await api.get(`/users/${username}/saves`, {
    headers: authHeaders(),
  });

  const data = unwrapResponse<SavedPostsResponse>(res);
  return Array.isArray(data) ? data : (data.items ?? []);
}

export default function MePage() {
  const [activeTab, setActiveTab] = useState<"gallery" | "saved">("gallery");

  const {
    data: me,
    isPending,
    error,
  } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const username = me?.profile.username ?? "";

  const { data: allPosts = [] } = useQuery({
    queryKey: ["all-posts"],
    queryFn: fetchAllPosts,
    enabled: !!username,
  });

  const { data: savedPosts = [] } = useQuery({
    queryKey: ["saved-posts", username],
    queryFn: () => fetchSavedPosts(username),
    enabled: !!username,
  });

  useEffect(() => {
    if (!me) return;
    localStorage.setItem("me_username", me.profile.name || me.profile.username);
    localStorage.setItem("me_avatar", me.profile.avatarUrl || DEFAULT_AVATAR);
  }, [me]);

  const galleryPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const author = post.author ?? post.user;
      return author?.username === username;
    });
  }, [allPosts, username]);

  if (isPending) return <div className="p-6">Loading profile...</div>;
  if (error || !me) return <div className="p-6">Gagal mengambil profile</div>;

  const currentPosts = activeTab === "gallery" ? galleryPosts : savedPosts;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-6 md:flex-row">
            <img
              src={getAvatarSrc(me.profile.avatarUrl)}
              alt="Avatar"
              className="h-24 w-24 rounded-full object-cover"
            />

            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-4xl font-bold">{me.profile.name}</h1>
                  <p className="text-2xl text-gray-400">
                    @{me.profile.username}
                  </p>
                </div>

                <Link
                  href="/me/edit"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-base font-medium text-white"
                >
                  Edit Profile
                </Link>
              </div>

              <p className="max-w-3xl text-lg text-white/90">
                {me.profile.bio ??
                  "Tambahkan bio kamu dari tombol Edit Profile."}
              </p>

              <div className="grid grid-cols-4 border-y border-white/10 py-6 text-center">
                <div>
                  <div className="text-4xl font-bold">
                    {galleryPosts.length}
                  </div>
                  <div className="mt-2 text-xl text-gray-400">Post</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">{me.stats.followers}</div>
                  <div className="mt-2 text-xl text-gray-400">Followers</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">{me.stats.following}</div>
                  <div className="mt-2 text-xl text-gray-400">Following</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">{me.stats.likes}</div>
                  <div className="mt-2 text-xl text-gray-400">Likes</div>
                </div>
              </div>

              <div className="flex gap-10 border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("gallery")}
                  className={`flex items-center gap-2 border-b-2 pb-4 text-lg ${
                    activeTab === "gallery"
                      ? "border-white text-white"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  <Grid2x2 className="h-5 w-5" />
                  Gallery
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("saved")}
                  className={`flex items-center gap-2 border-b-2 pb-4 text-lg ${
                    activeTab === "saved"
                      ? "border-white text-white"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  <Bookmark className="h-5 w-5" />
                  Saved
                </button>
              </div>
            </div>
          </div>

          {currentPosts.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 p-12 text-center text-2xl text-gray-400">
              {activeTab === "gallery"
                ? "Belum ada post di gallery."
                : "Belum ada post tersimpan."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {currentPosts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square overflow-hidden rounded-md bg-[#111]"
                >
                  <img
                    src={post.imageUrl || DEFAULT_AVATAR}
                    alt={post.caption ?? "Post image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
