"use client";

import { Suspense, use, useContext, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ReactReduxContext } from "react-redux";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/features/posts/components/post-card";
import { PostCardSkeleton } from "@/features/posts/components/post-card-skeleton";
import { PublicProfileHeader } from "@/features/profile/components/public-profile-header";
import { usePublicProfile, useUserLikes, useUserPosts } from "@/features/profile/public-profile";

export interface PublicProfilePageProps {
  readonly params: Promise<{ username: string }> | { username: string };
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

function useAuthUser() {
  const reduxContext = useContext(ReactReduxContext);
  return useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => {
      if (!reduxContext) return null;
      const state = reduxContext.store.getState() as {
        auth?: { user?: { username?: string; name?: string } | null };
      } | undefined;
      return state?.auth?.user ?? null;
    },
    () => null,
  );
}

function PublicProfileSkeleton() {
  return (
    <div className="space-y-6 py-4 animate-pulse" aria-label="Loading profile">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-44 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-60 rounded" />
        </div>
      </div>
      <Skeleton className="h-11 w-28 rounded-full" />
      <div className="flex flex-col items-center gap-4 pt-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}

function ProfileContent({ params }: Readonly<PublicProfilePageProps>) {
  const router = useSafeRouter();
  const unwrapped = typeof (params as Promise<{ username: string }>).then === "function"
    ? use(params as Promise<{ username: string }>)
    : (params as { username: string });

  const rawUsername = unwrapped?.username ?? "";
  const username = decodeURIComponent(rawUsername);
  const authUser = useAuthUser();
  const isSelf = Boolean(authUser?.username && authUser.username.toLowerCase() === username.toLowerCase());

  const { profile, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = usePublicProfile(username);
  const { posts, isLoading: isPostsLoading, isError: isPostsError, refetch: refetchPosts } = useUserPosts(username);
  const { likedPosts, isLoading: isLikesLoading, isError: isLikesError, refetch: refetchLikes } = useUserLikes(username);

  const isNotFound = isProfileError || (!isProfileLoading && !profile);

  return (
    <div className="min-h-screen bg-black text-[#FDFDFD] pb-32">
      <Header userFallback={authUser?.name || authUser?.username} />
      <main className="w-full max-w-[361px] md:max-w-[812px] mx-auto px-4 pt-6 space-y-6">
        {isProfileLoading ? (
          <PublicProfileSkeleton />
        ) : isNotFound || !profile ? (
          <ErrorState
            title="User not found"
            message={profileError?.message ?? "The user you are looking for does not exist or has been removed."}
            onRetry={() => router?.push("/users/search")}
            retryLabel="Back to search"
          />
        ) : (
          <>
            <PublicProfileHeader profile={profile} isSelf={isSelf} />
            <Tabs defaultValue="posts">
              <TabsList aria-label="Profile content tabs" className="w-full justify-start">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="likes">Likes</TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                {isPostsLoading ? (
                  <div className="flex flex-col items-center gap-4"><PostCardSkeleton /><PostCardSkeleton /></div>
                ) : isPostsError ? (
                  <ErrorState title="Failed to load posts" onRetry={() => void refetchPosts()} />
                ) : posts.length === 0 ? (
                  <EmptyState title="No posts yet" description="This user hasn't posted anything yet." />
                ) : (
                  <div className="flex flex-col items-center gap-4">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
                )}
              </TabsContent>
              <TabsContent value="likes">
                {isLikesLoading ? (
                  <div className="flex flex-col items-center gap-4"><PostCardSkeleton /><PostCardSkeleton /></div>
                ) : isLikesError ? (
                  <ErrorState title="Failed to load liked posts" onRetry={() => void refetchLikes()} />
                ) : likedPosts.length === 0 ? (
                  <EmptyState title="No liked posts yet" description="This user hasn't liked any posts yet." />
                ) : (
                  <div className="flex flex-col items-center gap-4">{likedPosts.map((post) => <PostCard key={post.id} post={post} />)}</div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      <FloatingNav activeKey={isSelf ? "profile" : undefined} />
    </div>
  );
}

export default function PublicProfilePage(props: Readonly<PublicProfilePageProps>) {
  return (
    <Suspense fallback={<PublicProfileSkeleton />}>
      <ProfileContent {...props} />
    </Suspense>
  );
}
