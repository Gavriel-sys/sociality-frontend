import type { QueryClient } from "@tanstack/react-query";
import type { Post } from "./types";

export function isPostQueryKey(queryKey: readonly unknown[]): boolean {
  const isPostLikesQuery = queryKey[0] === "public" && queryKey[1] === "post" && queryKey[3] === "likes";
  if (isPostLikesQuery) return false;
  return queryKey.some((part) => {
    if (typeof part !== "string") return false;
    const label = part.toLowerCase();
    return label.includes("feed") || label.includes("explore") || label.includes("post") || label.includes("save") || label.includes("like");
  });
}

function matchesPostId(id: unknown, targetId: string | number): boolean {
  return id !== undefined && id !== null && String(id) === String(targetId);
}

function updateList(list: readonly unknown[], targetId: string | number, updater: (p: Post) => Post): readonly unknown[] {
  let changed = false;
  const next = list.map((item) => {
    if (typeof item === "object" && item !== null && "id" in item && matchesPostId((item as { id: unknown }).id, targetId)) {
      changed = true;
      return updater(item as Post);
    }
    return item;
  });
  return changed ? next : list;
}

function updateContainer(item: unknown, targetId: string | number, updater: (p: Post) => Post): unknown {
  if (Array.isArray(item)) return updateList(item, targetId, updater);
  if (typeof item === "object" && item !== null) {
    const rec = item as Record<string, unknown>;
    if (Array.isArray(rec.posts)) return { ...rec, posts: updateList(rec.posts, targetId, updater) };
    if (Array.isArray(rec.data)) return { ...rec, data: updateList(rec.data, targetId, updater) };
    if ("id" in rec && matchesPostId(rec.id, targetId)) return updater(item as unknown as Post);
  }
  return item;
}

function updatePostStructure(old: unknown, targetId: string | number, updater: (p: Post) => Post): unknown {
  if (typeof old !== "object" || old === null) return old;
  if ("pages" in old && Array.isArray((old as { pages: unknown[] }).pages)) {
    const inf = old as { pages: readonly unknown[]; pageParams: readonly unknown[] };
    return { ...inf, pages: inf.pages.map((page) => updateContainer(page, targetId, updater)) };
  }
  return updateContainer(old, targetId, updater);
}

function removeList(list: readonly unknown[], targetId: string | number): readonly unknown[] {
  return list.filter((item) => !(typeof item === "object" && item !== null && "id" in item && matchesPostId((item as { id: unknown }).id, targetId)));
}

function removeContainer(item: unknown, targetId: string | number): unknown {
  if (Array.isArray(item)) return removeList(item, targetId);
  if (typeof item === "object" && item !== null) {
    const rec = item as Record<string, unknown>;
    if (Array.isArray(rec.posts)) return { ...rec, posts: removeList(rec.posts, targetId) };
    if (Array.isArray(rec.data)) return { ...rec, data: removeList(rec.data, targetId) };
    if ("id" in rec && matchesPostId(rec.id, targetId)) return undefined;
  }
  return item;
}

function removePostStructure(old: unknown, targetId: string | number): unknown {
  if (typeof old !== "object" || old === null) return old;
  if ("pages" in old && Array.isArray((old as { pages: unknown[] }).pages)) {
    const inf = old as { pages: readonly unknown[]; pageParams: readonly unknown[] };
    return { ...inf, pages: inf.pages.map((page) => removeContainer(page, targetId)) };
  }
  return removeContainer(old, targetId);
}

function findInList(list: readonly unknown[], targetId: string | number): Post | undefined {
  for (const item of list) {
    if (typeof item === "object" && item !== null && "id" in item && matchesPostId((item as { id: unknown }).id, targetId)) {
      return item as Post;
    }
  }
  return undefined;
}

function findPostInStructure(data: unknown, targetId: string | number): Post | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  if (Array.isArray(data)) return findInList(data, targetId);
  if ("pages" in data && Array.isArray((data as { pages: unknown[] }).pages)) {
    for (const page of (data as { pages: readonly unknown[] }).pages) {
      const found = findPostInStructure(page, targetId);
      if (found) return found;
    }
  }
  const rec = data as Record<string, unknown>;
  if (Array.isArray(rec.posts)) return findInList(rec.posts, targetId);
  if (Array.isArray(rec.data)) return findInList(rec.data, targetId);
  if ("id" in rec && matchesPostId(rec.id, targetId)) return rec as unknown as Post;
  return undefined;
}

export function findPostInCache(queryClient: QueryClient, postId: string | number): Post | undefined {
  const queries = queryClient.getQueriesData<unknown>({ predicate: (q) => isPostQueryKey(q.queryKey) });
  for (const [, data] of queries) {
    const found = findPostInStructure(data, postId);
    if (found) return found;
  }
  return undefined;
}

export function updatePostInCache(queryClient: QueryClient, postId: string | number, updater: (p: Post) => Post): void {
  queryClient.setQueriesData<unknown>(
    { predicate: (q) => isPostQueryKey(q.queryKey) },
    (old: unknown) => updatePostStructure(old, postId, updater),
  );
}

export function removePostFromCache(queryClient: QueryClient, postId: string | number): void {
  queryClient.setQueriesData<unknown>(
    { predicate: (q) => isPostQueryKey(q.queryKey) },
    (old: unknown) => removePostStructure(old, postId),
  );
}

export function snapshotPostQueries(queryClient: QueryClient): readonly [readonly unknown[], unknown][] {
  return queryClient.getQueriesData<unknown>({ predicate: (q) => isPostQueryKey(q.queryKey) });
}

export function restorePostQueries(queryClient: QueryClient, snapshot?: readonly [readonly unknown[], unknown][]): void {
  if (!snapshot) return;
  const snapshotMap = new Map<string, unknown>();
  for (const [key, data] of snapshot) {
    snapshotMap.set(JSON.stringify(key), data);
    queryClient.setQueryData(key, data);
  }
  const current = queryClient.getQueriesData<unknown>({ predicate: (q) => isPostQueryKey(q.queryKey) });
  for (const [key] of current) {
    if (!snapshotMap.has(JSON.stringify(key))) queryClient.removeQueries({ queryKey: key, exact: true });
  }
}

export function invalidatePostQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ predicate: (q) => isPostQueryKey(q.queryKey) });
}
