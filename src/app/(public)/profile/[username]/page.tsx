"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyLikes,
  fetchMySaved,
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
import { PageShell, Surface } from "@/components/page-shell";
import { PostCard } from "@/components/post-card";
import { UserChip } from "@/components/user-chip";
import { Button } from "@/components/ui/button";
import { getNextPageParam } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = String(params.username);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  const [networkPanel, setNetworkPanel] = useState<"followers" | "following" | null>(null);
  const isLoggedIn = !!getToken();

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchPublicProfile(username),
  });

  const likedStateQuery = useQuery({
    queryKey: ["profile-liked-state", username],
    queryFn: () => fetchMyLikes({ page: 1, limit: 100 }),
    enabled: isLoggedIn,
  });

  const savedStateQuery = useQuery({
    queryKey: ["profile-saved-state", username],
    queryFn: () => fetchMySaved({ page: 1, limit: 100 }),
    enabled: isLoggedIn,
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ["profile-posts", username],
    queryFn: ({ pageParam }) => fetchUserPosts(username, { page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
    enabled: activeTab === "posts",
  });

  const likesQuery = useInfiniteQuery({
    queryKey: ["profile-likes", username],
    queryFn: ({ pageParam }) => fetchUserLikes(username, { page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
    enabled: activeTab === "likes",
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

  const posts = postsQuery.data?.pages.flatMap((page) => page.posts) ?? [];
  const likedPosts = likesQuery.data?.pages.flatMap((page) => page.posts) ?? [];
  const currentPosts = activeTab === "posts" ? posts : likedPosts;
  const networkUsers = networkQuery.data?.pages.flatMap((page) => page.users) ?? [];
  const likeIds = new Set(likedStateQuery.data?.posts.map((post) => post.id) ?? []);
  const saveIds = new Set(savedStateQuery.data?.posts.map((post) => post.id) ?? []);

  if (profileQuery.isPending) {
    return <div className="p-6 text-white">Loading profile...</div>;
  }

  if (profileQuery.error || !profileQuery.data) {
    return <div className="p-6 text-white">Profile tidak ditemukan</div>;
  }

  const profile = profileQuery.data;

  return (
    <>
      <PageShell
        eyebrow="Public profile"
        title={profile.name}
        description={profile.bio || "Belum ada bio untuk user ini."}
        actions={
          profile.isMe ? (
            <Button asChild className="h-12 rounded-full px-6">
              <Link href="/me">Go to my profile</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant={profile.isFollowing ? "outline" : "default"}
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              className="h-12 rounded-full px-6"
            >
              {followMutation.isPending
                ? "Memproses..."
                : profile.isFollowing
                  ? "Following"
                  : "Follow"}
            </Button>
          )
        }
      >
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Surface className="space-y-5">
            <img src={profile.avatarUrl || DEFAULT_AVATAR} alt={profile.name} className="h-32 w-32 rounded-full object-cover ring-1 ring-white/10" />
            <p className="text-sm text-white/45">@{profile.username}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <button type="button" onClick={() => setNetworkPanel("followers")} className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-left">
                <p className="text-sm text-white/45">Followers</p>
                <p className="mt-2 text-2xl font-semibold text-white">{profile.counts.followers}</p>
              </button>
              <button type="button" onClick={() => setNetworkPanel("following")} className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-left">
                <p className="text-sm text-white/45">Following</p>
                <p className="mt-2 text-2xl font-semibold text-white">{profile.counts.following}</p>
              </button>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-left">
                <p className="text-sm text-white/45">Posts</p>
                <p className="mt-2 text-2xl font-semibold text-white">{profile.counts.post}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-left">
                <p className="text-sm text-white/45">Likes</p>
                <p className="mt-2 text-2xl font-semibold text-white">{profile.counts.likes}</p>
              </div>
            </div>
          </Surface>

          <div className="space-y-6">
            <Surface>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("posts")}
                  className={`rounded-full px-5 py-3 text-sm font-medium ${
                    activeTab === "posts" ? "bg-white text-black" : "border border-white/10 text-white/65"
                  }`}
                >
                  Posts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("likes")}
                  className={`rounded-full px-5 py-3 text-sm font-medium ${
                    activeTab === "likes" ? "bg-white text-black" : "border border-white/10 text-white/65"
                  }`}
                >
                  Likes
                </button>
              </div>
            </Surface>

            {activeTab === "posts" && postsQuery.isPending ? (
              <Surface className="text-center text-white/70">Memuat post...</Surface>
            ) : activeTab === "likes" && likesQuery.isPending ? (
              <Surface className="text-center text-white/70">Memuat likes...</Surface>
            ) : currentPosts.length === 0 ? (
              <EmptyState
                title={activeTab === "posts" ? "Belum ada post" : "Belum ada post yang di-like"}
                description={
                  activeTab === "posts"
                    ? "Saat user ini mulai memposting, daftarnya akan tampil di sini."
                    : "Jika likes profile ini public dan sudah ada datanya, daftar post akan muncul di sini."
                }
              />
            ) : (
              <div className="space-y-6">
                {currentPosts.map((post) => (
                  <PostCard
                    key={`${activeTab}-${post.id}`}
                    post={post}
                    forceLiked={activeTab === "likes" || likeIds.has(post.id)}
                    forceSaved={saveIds.has(post.id)}
                  />
                ))}

                {(activeTab === "posts" ? postsQuery.hasNextPage : likesQuery.hasNextPage) ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        activeTab === "posts"
                          ? postsQuery.fetchNextPage()
                          : likesQuery.fetchNextPage()
                      }
                      disabled={
                        activeTab === "posts"
                          ? postsQuery.isFetchingNextPage
                          : likesQuery.isFetchingNextPage
                      }
                      className="h-12 rounded-full px-6"
                    >
                      {activeTab === "posts"
                        ? postsQuery.isFetchingNextPage
                          ? "Memuat..."
                          : "Load more"
                        : likesQuery.isFetchingNextPage
                          ? "Memuat..."
                          : "Load more"}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </PageShell>

      {networkPanel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#060915] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-violet-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {networkPanel === "followers" ? "Followers" : "Following"}
                  </p>
                  <p className="text-sm text-white/45">@{profile.username}</p>
                </div>
              </div>
              <Button type="button" variant="ghost" onClick={() => setNetworkPanel(null)} className="rounded-full text-white/60 hover:bg-white/5 hover:text-white">
                Close
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {!networkUsers.length && networkQuery.isPending ? (
                <p className="text-center text-white/65">Memuat daftar...</p>
              ) : !networkUsers.length ? (
                <EmptyState title="Belum ada data" description="Daftar followers/following akan muncul di sini jika sudah tersedia." />
              ) : (
                <div className="space-y-4">
                  {networkUsers.map((user) => (
                    <UserChip key={`${networkPanel}-${user.id}-${user.username}`} user={user} />
                  ))}
                </div>
              )}
            </div>

            {networkQuery.hasNextPage ? (
              <div className="border-t border-white/10 px-6 py-4">
                <Button type="button" variant="outline" onClick={() => networkQuery.fetchNextPage()} disabled={networkQuery.isFetchingNextPage} className="h-11 w-full rounded-full">
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
