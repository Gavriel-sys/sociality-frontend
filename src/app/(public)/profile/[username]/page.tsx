"use client";

import Link from "next/link";
import { Heart, LayoutGrid, Send, Users } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPublicProfile,
  fetchUserFollowers,
  fetchUserFollowing,
  fetchUserLikes,
  fetchUserPosts,
  followUser,
  unfollowUser,
} from "@/lib/social-api";
import { buildLoginHref, getToken } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { UserChip } from "@/components/user-chip";
import { Button } from "@/components/ui/button";
import { formatCount, getNextPageParam } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = String(params.username);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"gallery" | "liked">("gallery");
  const [networkPanel, setNetworkPanel] = useState<"followers" | "following" | null>(null);
  const [copied, setCopied] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchPublicProfile(username),
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ["profile-gallery", username],
    queryFn: ({ pageParam }) => fetchUserPosts(username, { page: pageParam, limit: 18 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
    enabled: activeTab === "gallery",
  });

  const likesQuery = useInfiniteQuery({
    queryKey: ["profile-liked-gallery", username],
    queryFn: ({ pageParam }) => fetchUserLikes(username, { page: pageParam, limit: 18 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
    enabled: activeTab === "liked",
  });

  const networkQuery = useInfiniteQuery({
    queryKey: ["profile-network", username, networkPanel],
    queryFn: ({ pageParam }) => {
      if (networkPanel === "followers") {
        return fetchUserFollowers(username, { page: pageParam, limit: 20 });
      }

      return fetchUserFollowing(username, { page: pageParam, limit: 20 });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
    enabled: !!networkPanel,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!getToken()) {
        router.push(buildLoginHref(pathname));
        return null;
      }

      if (profileQuery.data?.isFollowing) {
        return unfollowUser(username);
      }

      return followUser(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({});
    },
  });

  if (profileQuery.isPending) {
    return <div className="p-6 text-white">Loading profile...</div>;
  }

  if (profileQuery.error || !profileQuery.data) {
    return <div className="p-6 text-white">Profile tidak ditemukan</div>;
  }

  const profile = profileQuery.data;
  const galleryItems = postsQuery.data?.pages.flatMap((page) => page.posts) ?? [];
  const likedItems = likesQuery.data?.pages.flatMap((page) => page.posts) ?? [];
  const currentItems = activeTab === "gallery" ? galleryItems : likedItems;
  const currentQuery = activeTab === "gallery" ? postsQuery : likesQuery;
  const networkUsers = networkQuery.data?.pages.flatMap((page) => page.users) ?? [];

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
    <>
      <div className="mx-auto w-full max-w-[980px] px-4 pb-28 pt-10 sm:px-6 lg:px-8">
        <section className="space-y-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <img
                src={profile.avatarUrl || DEFAULT_AVATAR}
                alt={profile.name}
                className="h-[72px] w-[72px] rounded-full object-cover sm:h-20 sm:w-20"
              />
              <div>
                <h1 className="text-3xl font-semibold text-white">{profile.name}</h1>
                <p className="mt-2 text-xl text-white/68">{profile.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile.isMe ? (
                <Link
                  href="/me"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white"
                >
                  My Profile
                </Link>
              ) : (
                <Button
                  type="button"
                  variant={profile.isFollowing ? "outline" : "default"}
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className="h-12 rounded-full border-white/15 px-6 text-sm font-semibold text-white"
                >
                  {followMutation.isPending
                    ? "Processing..."
                    : profile.isFollowing
                      ? "Following"
                      : "Follow"}
                </Button>
              )}

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
            {profile.bio || "This user has not added a bio yet."}
          </p>

          <div className="grid overflow-hidden rounded-[24px] border border-white/10 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className="border-b border-white/10 px-4 py-5 text-center transition hover:bg-white/[0.02] sm:border-b-0 sm:border-r sm:border-white/10"
            >
              <p className="text-4xl font-semibold text-white">{formatCount(profile.counts.post)}</p>
              <p className="mt-2 text-xl text-white/58">Post</p>
            </button>
            <button
              type="button"
              onClick={() => setNetworkPanel("followers")}
              className="border-b border-white/10 px-4 py-5 text-center transition hover:bg-white/[0.02] sm:border-b-0 sm:border-r sm:border-white/10"
            >
              <p className="text-4xl font-semibold text-white">{formatCount(profile.counts.followers)}</p>
              <p className="mt-2 text-xl text-white/58">Followers</p>
            </button>
            <button
              type="button"
              onClick={() => setNetworkPanel("following")}
              className="border-b border-white/10 px-4 py-5 text-center transition hover:bg-white/[0.02] sm:border-b-0 sm:border-r sm:border-white/10"
            >
              <p className="text-4xl font-semibold text-white">{formatCount(profile.counts.following)}</p>
              <p className="mt-2 text-xl text-white/58">Following</p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("liked")}
              className="px-4 py-5 text-center transition hover:bg-white/[0.02]"
            >
              <p className="text-4xl font-semibold text-white">{formatCount(profile.counts.likes)}</p>
              <p className="mt-2 text-xl text-white/58">Likes</p>
            </button>
          </div>

          <div className="border-b border-white/10">
            <div className="flex items-center gap-8">
              <TabButton
                active={activeTab === "gallery"}
                icon={<LayoutGrid className="h-5 w-5" />}
                label="Gallery"
                onClick={() => setActiveTab("gallery")}
              />
              <TabButton
                active={activeTab === "liked"}
                icon={<Heart className="h-5 w-5" />}
                label="Liked"
                onClick={() => setActiveTab("liked")}
              />
            </div>
          </div>

          {currentQuery.isPending ? (
            <div className="py-16 text-center text-white/62">Memuat koleksi...</div>
          ) : currentItems.length ? (
            <>
              <GalleryGrid items={currentItems} />
              {currentQuery.hasNextPage ? (
                <div className="flex justify-center pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => currentQuery.fetchNextPage()}
                    disabled={currentQuery.isFetchingNextPage}
                    className="h-11 rounded-full border-white/10 bg-[#050b16] px-6 text-white"
                  >
                    {currentQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title={activeTab === "gallery" ? "Belum ada post" : "Belum ada likes public"}
              description={
                activeTab === "gallery"
                  ? "Saat user ini mulai memposting, galeri akan tampil di sini."
                  : "Jika user ini punya liked posts yang tersedia, koleksinya akan muncul di sini."
              }
            />
          )}
        </section>
      </div>

      {networkPanel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-[28px] border border-white/10 bg-[#040a16] shadow-[0_24px_80px_rgba(0,0,0,0.48)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {networkPanel === "followers" ? "Followers" : "Following"}
                  </p>
                  <p className="text-sm text-white/45">@{profile.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNetworkPanel(null)}
                className="text-sm font-medium text-white/62 transition hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
              {!networkUsers.length && networkQuery.isPending ? (
                <p className="text-center text-white/62">Memuat daftar...</p>
              ) : !networkUsers.length ? (
                <EmptyState
                  title="Belum ada data"
                  description="Daftar followers atau following akan muncul di sini jika sudah tersedia."
                />
              ) : (
                networkUsers.map((user) => (
                  <UserChip key={`${networkPanel}-${user.id}-${user.username}`} user={user} />
                ))
              )}
            </div>

            {networkQuery.hasNextPage ? (
              <div className="border-t border-white/10 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => networkQuery.fetchNextPage()}
                  disabled={networkQuery.isFetchingNextPage}
                  className="h-11 w-full rounded-full border-white/10 bg-[#050b16] text-white"
                >
                  {networkQuery.isFetchingNextPage ? "Memuat..." : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
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

