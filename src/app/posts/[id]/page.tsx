"use client";

import { Suspense, use, useContext, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ReactReduxContext } from "react-redux";
import { ErrorState } from "@/components/feedback/error-state";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Header } from "@/components/layout/header";
import { PostCardSkeleton } from "@/features/posts/components/post-card-skeleton";
import { PostDetailView } from "@/features/posts/components/post-detail-view";
import { usePostDetail } from "@/features/posts/use-post-detail";

export interface PostDetailPageProps {
  readonly params: Promise<{ id: string }> | { id: string };
}

function useAuthUser() {
  const reduxContext = useContext(ReactReduxContext);
  return useSyncExternalStore(
    (cb) => (reduxContext ? reduxContext.store.subscribe(cb) : () => {}),
    () => ((reduxContext?.store.getState() as { auth?: { user?: { username?: string; name?: string } | null } })?.auth?.user ?? null),
    () => null,
  );
}

function PostDetailContent({ params }: Readonly<PostDetailPageProps>) {
  const router = useRouter();
  const unwrapped = typeof (params as Promise<{ id: string }>).then === "function"
    ? use(params as Promise<{ id: string }>)
    : (params as { id: string });

  const postId = decodeURIComponent(unwrapped?.id ?? "");
  const authUser = useAuthUser();
  const { post, isLoading, isError, error } = usePostDetail(postId);

  const isNotFound = isError || (!isLoading && !post);

  return (
    <div className="min-h-screen bg-black text-[#FDFDFD] pb-32">
      <Header userFallback={authUser?.name || authUser?.username} />
      <main className="w-full max-w-[361px] md:max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {isLoading ? (
          <PostCardSkeleton />
        ) : isNotFound || !post ? (
          <ErrorState
            title="Post not found"
            message={error?.message ?? "The post you are looking for does not exist or has been removed."}
            onRetry={() => router.push("/explore")}
            retryLabel="Explore posts"
          />
        ) : (
          <PostDetailView post={post} />
        )}
      </main>
      <FloatingNav />
    </div>
  );
}

export default function PostDetailPage(props: Readonly<PostDetailPageProps>) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black p-4"><PostCardSkeleton /></div>}>
      <PostDetailContent {...props} />
    </Suspense>
  );
}
