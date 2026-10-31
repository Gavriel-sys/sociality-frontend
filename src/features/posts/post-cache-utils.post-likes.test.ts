import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { findPostInCache, removePostFromCache, updatePostInCache } from "./post-cache-utils";
import { normalizePost } from "./types";

const likesKey = ["public", "post", "42", "likes"] as const;
const postKey = ["public", "post", "42"] as const;
const likedUsers = [{ id: 42, name: "Alex", username: "alex" }];

function createContext() {
  const queryClient = new QueryClient();
  const post = normalizePost({ id: 42, likesCount: 1 });
  queryClient.setQueryData(likesKey, likedUsers);
  queryClient.setQueryData(postKey, post);
  return { queryClient, post };
}

describe("post caches with a Liked by user sharing the post ID", () => {
  it("finds the post rather than the user", () => {
    const { queryClient, post } = createContext();

    const cachedPost = findPostInCache(queryClient, 42);

    expect(cachedPost).toEqual(post);
  });

  it("updates the post without adding post state to the user", () => {
    const { queryClient, post } = createContext();

    updatePostInCache(queryClient, 42, (cachedPost) => ({ ...cachedPost, isLiked: true }));

    expect(queryClient.getQueryData(postKey)).toEqual({ ...post, isLiked: true });
    expect(queryClient.getQueryData(likesKey)).toEqual(likedUsers);
  });

  it("removes the post without removing the user", () => {
    const { queryClient, post } = createContext();
    queryClient.setQueryData(["feed"], [post]);

    removePostFromCache(queryClient, 42);

    expect(queryClient.getQueryData(["feed"])).toEqual([]);
    expect(queryClient.getQueryData(likesKey)).toEqual(likedUsers);
  });
});
