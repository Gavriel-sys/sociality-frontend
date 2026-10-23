"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useInfiniteExplore } from "@/features/explore/use-infinite-explore";
import { PostCard } from "@/features/posts/components/post-card";
import { PostCardSkeleton } from "@/features/posts/components/post-card-skeleton";
import { useAppSelector } from "@/lib/store/hooks";

function ExploreView() {
  const user = useAppSelector((state) => state.auth.user);
  const {
    posts,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteExplore();

  return (
    <div className="min-h-screen bg-black text-[#FDFDFD] pb-32">
      <Header userFallback={user?.name || user?.username} />
      <main className="mx-auto w-full max-w-[361px] md:max-w-[600px] px-4 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#FDFDFD]">
            Explore
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-6" aria-label="Loading explore posts" role="status">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : isError || !posts ? (
          <ErrorState
            title="Failed to load explore posts"
            message={error?.message ?? "An unexpected error occurred while loading explore posts."}
            onRetry={() => void refetch()}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            title="No explore posts available"
            description="Check back later for new posts from the community."
          />
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            <div className="flex justify-center pt-2">
              {hasNextPage ? (
                <Button
                  onClick={() => void fetchNextPage()}
                  isLoading={isFetchingNextPage}
                >
                  Load more posts
                </Button>
              ) : (
                <p className="text-xs text-[#A4A7AE]">You&apos;re all caught up!</p>
              )}
            </div>
          </div>
        )}
      </main>
      <FloatingNav />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <AuthGuard>
      <ExploreView />
    </AuthGuard>
  );
}
