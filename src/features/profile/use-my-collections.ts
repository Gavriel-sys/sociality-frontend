"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { usePostQueryClient, usePostSession } from "@/features/posts/use-post-context";
import type { Post } from "@/features/posts/types";
import { fetchMyPostCollection, myPostCollectionKey } from "./my-post-collections";
import type { MyPostCollection } from "./my-post-collections";

export function useMyPostCollection(collection: MyPostCollection): UseQueryResult<readonly Post[], Error> {
  const { token, sessionId } = usePostSession();
  const queryClient = usePostQueryClient();
  return useQuery({
    queryKey: myPostCollectionKey(sessionId ?? "unauthenticated", collection),
    queryFn: ({ signal }) => fetchMyPostCollection({ collection, token, signal }),
    enabled: Boolean(token && sessionId),
    staleTime: 30_000,
  }, queryClient);
}

export function useMySavedPosts(): UseQueryResult<readonly Post[], Error> {
  return useMyPostCollection("saved");
}
