import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { FeedData, PostItem, PostListData } from "@/types/social";

export const FEED_QUERY_KEY = ["feed"] as const;
export const ME_SAVED_QUERY_KEY = ["me-saved"] as const;
export const ME_LIKES_QUERY_KEY = ["my-likes"] as const;

export function postQueryKey(postId: number | string) {
  return ["post", String(postId)] as const;
}

type PostUpdater = (post: PostItem) => PostItem;

function updateFeedPage(
  page: FeedData,
  postId: number,
  updater: PostUpdater,
): FeedData {
  return {
    ...page,
    items: page.items.map((post) => (post.id === postId ? updater(post) : post)),
  };
}

function updatePostListPage(
  page: PostListData,
  postId: number,
  updater: PostUpdater,
): PostListData {
  return {
    ...page,
    posts: page.posts.map((post) => (post.id === postId ? updater(post) : post)),
  };
}

export function updatePostCaches(
  queryClient: QueryClient,
  postId: number,
  updater: PostUpdater,
) {
  queryClient.setQueryData<PostItem>(postQueryKey(postId), (current) =>
    current ? updater(current) : current,
  );

  queryClient.setQueryData<InfiniteData<FeedData>>(FEED_QUERY_KEY, (current) =>
    current
      ? {
          ...current,
          pages: current.pages.map((page) => updateFeedPage(page, postId, updater)),
        }
      : current,
  );

  queryClient.setQueryData<InfiniteData<PostListData>>(
    ME_SAVED_QUERY_KEY,
    (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) =>
              updatePostListPage(page, postId, updater),
            ),
          }
        : current,
  );

  queryClient.setQueryData<InfiniteData<PostListData>>(
    ME_LIKES_QUERY_KEY,
    (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) =>
              updatePostListPage(page, postId, updater),
            ),
          }
        : current,
  );
}

export function addPostToSavedCache(queryClient: QueryClient, post: PostItem) {
  queryClient.setQueryData<InfiniteData<PostListData>>(ME_SAVED_QUERY_KEY, (current) => {
    if (!current?.pages.length) {
      return current;
    }

    if (current.pages.some((page) => page.posts.some((item) => item.id === post.id))) {
      return current;
    }

    const [firstPage, ...restPages] = current.pages;

    return {
      ...current,
      pages: [
        {
          ...firstPage,
          posts: [{ ...post, savedByMe: true }, ...firstPage.posts],
          pagination: {
            ...firstPage.pagination,
            total: firstPage.pagination.total + 1,
          },
        },
        ...restPages,
      ],
    };
  });
}

export function removePostFromSavedCache(
  queryClient: QueryClient,
  postId: number,
) {
  queryClient.setQueryData<InfiniteData<PostListData>>(ME_SAVED_QUERY_KEY, (current) => {
    if (!current) {
      return current;
    }

    return {
      ...current,
      pages: current.pages.map((page) => {
        const filteredPosts = page.posts.filter((post) => post.id !== postId);
        const removedCount = page.posts.length - filteredPosts.length;

        if (!removedCount) {
          return page;
        }

        return {
          ...page,
          posts: filteredPosts,
          pagination: {
            ...page.pagination,
            total: Math.max(page.pagination.total - removedCount, 0),
          },
        };
      }),
    };
  });
}
