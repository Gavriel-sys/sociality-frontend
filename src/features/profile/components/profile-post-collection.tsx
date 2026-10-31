"use client";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PostCard } from "@/features/posts/components/post-card";
import { PostCardSkeleton } from "@/features/posts/components/post-card-skeleton";
import type { MyPostCollection } from "../my-post-collections";
import { useMyPostCollection } from "../use-my-collections";
import { ProfilePostGrid, ProfilePostGridSkeleton } from "./profile-post-grid";
import { ProfileEmptyGallery } from "./profile-empty-gallery";

const emptyCollectionTitles: Record<Exclude<MyPostCollection, "posts">, string> = {
  saved: "No saved posts yet",
  likes: "No liked posts yet",
};

export function ProfilePostCollection({ collection }: { readonly collection: MyPostCollection }) {
  const { data: posts = [], isLoading, isError, error, refetch } = useMyPostCollection(collection);
  if (isLoading) return collection === "likes" ? <PostCardSkeleton /> : <ProfilePostGridSkeleton />;
  if (isError) return <ErrorState title="Failed to load posts" message={error.message} onRetry={() => void refetch()} />;
  if (posts.length === 0) {
    return collection === "posts" ? <ProfileEmptyGallery /> : <EmptyState title={emptyCollectionTitles[collection]} />;
  }
  if (collection !== "likes") return <ProfilePostGrid posts={posts} />;
  return <div className="flex flex-col items-center gap-6">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>;
}
