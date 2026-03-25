"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchPublicProfile,
  fetchUserPosts,
  followUser,
  unfollowUser,
} from "@/lib/social-api";
import { useSessionSnapshot } from "@/lib/use-session";
import { buildLoginHref, getToken } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Grid, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { getNextPageParam } from "@/lib/utils";

const DEFAULT_AVATAR = "/avatars/default-avatar.png";

const getAvatar = (url?: string | null) => {
  if (!url || url === "null" || url.trim() === "") return DEFAULT_AVATAR;
  return url;
};

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const router = useRouter();
  const session = useSessionSnapshot();
  const queryClient = useQueryClient();

  const isMyProfile = session.username === username;

  // 1. Fetch Profile Info
  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchPublicProfile(username),
  });

  // 2. Fetch Profile Posts
  const postsQuery = useInfiniteQuery({
    queryKey: ["profile-posts", username],
    queryFn: ({ pageParam }) =>
      fetchUserPosts(username, { page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPageParam(lastPage.pagination),
  });

  // 3. Follow / Unfollow Mutation
  const followMutation = useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      if (!getToken()) {
        router.push(buildLoginHref(`/profile/${username}`));
        throw new Error("Login required");
      }
      return currentlyFollowing ? unfollowUser(username) : followUser(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      queryClient.invalidateQueries({ queryKey: ["my-following"] });
    },
  });

  if (profileQuery.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/50">
        Memuat profil...
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="User Tidak Ditemukan"
          description={`Kami tidak dapat menemukan profil dengan username @${username}.`}
          ctaLabel="Kembali ke Feed"
          ctaHref="/feed"
        />
      </div>
    );
  }

  const profile = profileQuery.data;
  const posts = postsQuery.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Profile Section */}
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8 mb-12">
        <img
          src={getAvatar(profile.avatarUrl)}
          alt={profile.name}
          className="h-32 w-32 shrink-0 rounded-full border border-white/10 object-cover sm:h-40 sm:w-40"
        />

        <div className="flex flex-1 flex-col items-center sm:items-start w-full">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
            <h1 className="text-2xl font-bold text-white">
              {profile.username}
            </h1>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isMyProfile ? (
                <Button
                  variant="outline"
                  asChild
                  className="rounded-full bg-[#050b16] text-white hover:bg-white/10 border-white/20"
                >
                  <Link href="/me/edit">Edit Profile</Link>
                </Button>
              ) : (
                <Button
                  onClick={() => followMutation.mutate(!!profile.isFollowing)}
                  disabled={followMutation.isPending}
                  className={`rounded-full px-6 font-semibold transition ${
                    profile.isFollowing
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-violet-600 text-white hover:bg-violet-500"
                  }`}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center sm:justify-start gap-8 text-white">
            <div className="flex flex-col sm:flex-row sm:gap-1.5 items-center">
              <span className="font-bold">{profile.postCount || 0}</span>
              <span className="text-white/60">posts</span>
            </div>
            <Link
              href={`/profile/${username}/followers`}
              className="flex flex-col sm:flex-row sm:gap-1.5 items-center hover:text-white/70"
            >
              <span className="font-bold">{profile.followersCount || 0}</span>
              <span className="text-white/60">followers</span>
            </Link>
            <Link
              href={`/profile/${username}/following`}
              className="flex flex-col sm:flex-row sm:gap-1.5 items-center hover:text-white/70"
            >
              <span className="font-bold">{profile.followingsCount || 0}</span>
              <span className="text-white/60">following</span>
            </Link>
          </div>

          <div className="mt-6 text-center sm:text-left text-white max-w-lg">
            <p className="font-semibold">{profile.name}</p>
            {profile.bio ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                {profile.bio}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-center gap-2 pb-6 text-sm font-semibold text-white">
          <Grid className="h-4 w-4" />
          <span>POSTS</span>
        </div>

        {postsQuery.isPending ? (
          <div className="text-center text-white/50 py-10">
            Memuat postingan...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-white">Belum ada post</p>
            <p className="mt-2 text-sm text-white/50">
              {isMyProfile
                ? "Bagikan foto pertamamu."
                : "User ini belum membuat post."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group relative aspect-square overflow-hidden bg-white/5 rounded-lg"
              >
                <img
                  src={post.imageUrl || DEFAULT_AVATAR}
                  alt={post.caption || "User post"}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-5 w-5 fill-white" />
                    <span>{post.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-5 w-5 fill-white" />
                    <span>{post.commentCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {postsQuery.hasNextPage ? (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => postsQuery.fetchNextPage()}
              disabled={postsQuery.isFetchingNextPage}
              className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              {postsQuery.isFetchingNextPage ? "Memuat..." : "Load More"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
