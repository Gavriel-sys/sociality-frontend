import { api, authHeaders, unwrapResponse } from "@/lib/api";
import type {
  AuthData,
  CommentItem,
  CommentListData,
  FeedData,
  MeData,
  Pagination,
  PostItem,
  PostLikesData,
  PostListData,
  PublicProfileData,
  SearchUsersData,
  UserListData,
} from "@/types/social";

type PagingOptions = {
  page?: number;
  limit?: number;
};

function withPaging(options?: PagingOptions) {
  return {
    page: options?.page ?? 1,
    limit: options?.limit ?? 20,
  };
}

export async function login(payload: { email: string; password: string }) {
  const res = await api.post("/auth/login", payload);
  return unwrapResponse<AuthData>(res);
}

export async function register(payload: {
  name: string;
  username: string;
  phone: string;
  email: string;
  password: string;
}) {
  const res = await api.post("/auth/register", payload);
  return unwrapResponse<AuthData>(res);
}

export async function fetchMe() {
  const res = await api.get("/me", {
    headers: authHeaders(),
  });

  return unwrapResponse<MeData>(res);
}

export async function updateMe(payload: {
  name: string;
  phone: string;
  bio: string;
}) {
  const res = await api.patch("/me", payload, {
    headers: authHeaders(),
  });

  return unwrapResponse<MeData>(res);
}

export async function fetchFeed(options?: PagingOptions) {
  const res = await api.get("/feed", {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<FeedData>(res);
}

export async function fetchPost(postId: string) {
  const res = await api.get(`/posts/${postId}`);
  return unwrapResponse<PostItem>(res);
}

export async function createPost(payload: FormData) {
  const res = await api.post("/posts", payload, {
    headers: authHeaders(),
  });

  return unwrapResponse<PostItem>(res);
}

export async function deletePost(postId: string) {
  const res = await api.delete(`/posts/${postId}`, {
    headers: authHeaders(),
  });

  return unwrapResponse<{ deleted: boolean }>(res);
}

export async function fetchPostComments(postId: string, options?: PagingOptions) {
  const res = await api.get(`/posts/${postId}/comments`, {
    params: withPaging({
      page: options?.page ?? 1,
      limit: options?.limit ?? 10,
    }),
  });

  return unwrapResponse<CommentListData>(res);
}

export async function createComment(postId: string, text: string) {
  const res = await api.post(
    `/posts/${postId}/comments`,
    { text },
    {
      headers: authHeaders(),
    },
  );

  return unwrapResponse<CommentItem>(res);
}

export async function deleteComment(commentId: number) {
  const res = await api.delete(`/comments/${commentId}`, {
    headers: authHeaders(),
  });

  return unwrapResponse<{ deleted: boolean }>(res);
}

export async function likePost(postId: number) {
  const res = await api.post(
    `/posts/${postId}/like`,
    {},
    {
      headers: authHeaders(),
    },
  );

  return unwrapResponse<{ liked: boolean; likeCount: number }>(res);
}

export async function unlikePost(postId: number) {
  const res = await api.delete(`/posts/${postId}/like`, {
    headers: authHeaders(),
  });

  return unwrapResponse<{ liked: boolean; likeCount: number }>(res);
}

export async function savePost(postId: number) {
  const res = await api.post(
    `/posts/${postId}/save`,
    {},
    {
      headers: authHeaders(),
    },
  );

  return unwrapResponse<{ saved: boolean }>(res);
}

export async function unsavePost(postId: number) {
  const res = await api.delete(`/posts/${postId}/save`, {
    headers: authHeaders(),
  });

  return unwrapResponse<{ saved: boolean }>(res);
}

export async function fetchPostLikes(postId: number, options?: PagingOptions) {
  const res = await api.get(`/posts/${postId}/likes`, {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<PostLikesData>(res);
}

export async function fetchPublicProfile(username: string) {
  const res = await api.get(`/users/${username}`, {
    headers: authHeaders(),
  });

  return unwrapResponse<PublicProfileData>(res);
}

export async function fetchUserPosts(username: string, options?: PagingOptions) {
  const res = await api.get(`/users/${username}/posts`, {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<PostListData>(res);
}

export async function fetchUserLikes(username: string, options?: PagingOptions) {
  const res = await api.get(`/users/${username}/likes`, {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<PostListData>(res);
}

export async function searchUsers(query: string, options?: PagingOptions) {
  const res = await api.get("/users/search", {
    headers: authHeaders(),
    params: {
      q: query,
      ...withPaging(options),
    },
  });

  return unwrapResponse<SearchUsersData>(res);
}

export async function fetchMyLikes(options?: PagingOptions) {
  const res = await api.get("/me/likes", {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<PostListData>(res);
}

export async function fetchMySaved(options?: PagingOptions) {
  const res = await api.get("/me/saved", {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<PostListData>(res);
}

export async function fetchMyFollowers(options?: PagingOptions) {
  const res = await api.get("/me/followers", {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<UserListData>(res);
}

export async function fetchMyFollowing(options?: PagingOptions) {
  const res = await api.get("/me/following", {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<UserListData>(res);
}

export async function fetchUserFollowers(username: string, options?: PagingOptions) {
  const res = await api.get(`/users/${username}/followers`, {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<UserListData>(res);
}

export async function fetchUserFollowing(username: string, options?: PagingOptions) {
  const res = await api.get(`/users/${username}/following`, {
    headers: authHeaders(),
    params: withPaging(options),
  });

  return unwrapResponse<UserListData>(res);
}

export async function followUser(username: string) {
  const res = await api.post(
    `/follow/${username}`,
    {},
    {
      headers: authHeaders(),
    },
  );

  return unwrapResponse<{ following: boolean }>(res);
}

export async function unfollowUser(username: string) {
  const res = await api.delete(`/follow/${username}`, {
    headers: authHeaders(),
  });

  return unwrapResponse<{ following: boolean }>(res);
}

export function hasNextPage(pagination?: Pagination | null) {
  if (!pagination) return false;
  return pagination.page < pagination.totalPages;
}
