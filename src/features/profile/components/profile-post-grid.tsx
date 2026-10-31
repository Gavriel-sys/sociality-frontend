"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/features/posts/types";

const gridClassName = "grid grid-cols-3 gap-[4px]";

function ProfilePostThumbnail({ post }: { readonly post: Post }) {
  const [failedImageSource, setFailedImageSource] = useState<string>();
  if (!post.imageUrl || failedImageSource === post.imageUrl) {
    return <div role="img" aria-label="Image unavailable" className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon /></div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={post.imageUrl} alt={post.caption ? `Post image: ${post.caption}` : "Post image"} loading="lazy" decoding="async" className="h-full w-full object-cover" onError={() => setFailedImageSource(post.imageUrl)} />
  );
}

function ProfilePostTile({ post }: { readonly post: Post }) {
  const label = post.caption ? `View post: ${post.caption}` : `View post by ${post.author.name || post.author.username}`;
  return (
    <Link href={`/posts/${encodeURIComponent(String(post.id))}`} aria-label={label} className="relative block aspect-square min-w-0 overflow-hidden rounded-[6px] bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <ProfilePostThumbnail post={post} />
    </Link>
  );
}

export function ProfilePostGrid({ posts }: { readonly posts: readonly Post[] }) {
  return <div className={gridClassName}>{posts.map((post) => <ProfilePostTile key={post.id} post={post} />)}</div>;
}

export function ProfilePostGridSkeleton() {
  return (
    <div role="status" aria-label="Loading posts" aria-busy="true" className={gridClassName}>
      {Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="aspect-square rounded-[6px]" />)}
    </div>
  );
}
