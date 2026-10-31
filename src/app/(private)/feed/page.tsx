"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useInfiniteFeed } from "@/features/feed/use-infinite-feed";
import { PostCard } from "@/features/posts/components/post-card";
import { PostCardSkeleton } from "@/features/posts/components/post-card-skeleton";
import { useAppSelector } from "@/lib/store/hooks";

function FeedView() {
  const router = useRouter();
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
  } = useInfiniteFeed();

  return (
    <div className="min-h-screen bg-black text-[#FDFDFD] pb-32">
      <Header userFallback={user?.name || user?.username} />
      <main className="mx-auto w-full max-w-[361px] md:max-w-[600px] px-4 pt-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6" aria-label="Loading feed" role="status">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to load feed"
            message={error?.message ?? "An unexpected error occurred while loading your feed."}
            onRetry={() => void refetch()}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            title="No posts in your feed yet"
            description="Check back later for new posts from the community."
            action={{
              label: "Find creators",
              onClick: () => router.push("/users/search"),
            }}
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
      <FloatingNav activeKey="home" />
    </div>
  );
}

export default function FeedPage() {
  return <FeedView />;
}
