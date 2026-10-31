import { normalizePost } from "@/features/posts/types";
import type { Post } from "@/features/posts/types";
import { apiFetch } from "@/lib/api/api-fetch";
import { queryKeys } from "@/lib/query/query-keys";

export type MyPostCollection = "posts" | "saved" | "likes";
const COLLECTION_PAGE_LIMIT = 10;

interface FetchCollectionOptions {
  readonly collection: MyPostCollection;
  readonly token?: string;
  readonly signal: AbortSignal;
}

export function myPostCollectionKey(sessionId: string, collection: MyPostCollection) {
  return [...queryKeys.private(sessionId).all, collection] as const;
}

function extractCollectionPosts(response: unknown): readonly unknown[] {
  if (Array.isArray(response)) return response;
  if (typeof response !== "object" || response === null) return [];
  const envelope = response as Record<string, unknown>;
  const nestedPosts = envelope.posts ?? envelope.items ?? envelope.saved ?? envelope.likes ?? envelope.data;
  return extractCollectionPosts(nestedPosts);
}

function normalizeCollection(response: unknown, collection: MyPostCollection): readonly Post[] {
  return extractCollectionPosts(response).map((rawPost) => {
    const post = normalizePost(rawPost);
    if (collection === "saved") return { ...post, isSaved: true };
    if (collection === "likes") return { ...post, isLiked: true };
    return post;
  });
}

export async function fetchMyPostCollection(options: FetchCollectionOptions): Promise<readonly Post[]> {
  const postsById = new Map<string, Post>();
  for (let page = 1; ; page += 1) {
    const response = await apiFetch<unknown>({
      endpoint: `/api/me/${options.collection}?page=${page}&limit=${COLLECTION_PAGE_LIMIT}`,
      token: options.token,
      signal: options.signal,
    });
    const pagePosts = normalizeCollection(response, options.collection);
    const previousSize = postsById.size;
    pagePosts.forEach((post) => postsById.set(String(post.id), post));
    if (pagePosts.length < COLLECTION_PAGE_LIMIT || postsById.size === previousSize) break;
  }
  return [...postsById.values()];
}
