// src/types/social.ts

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserSummary = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFollowedByMe?: boolean;
  followsMe?: boolean;
  isMe?: boolean;
};

export type UserProfile = {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  postCount?: number;
  followersCount?: number;
  followingsCount?: number;
};

export type UserStats = {
  posts: number;
  followers: number;
  following: number;
  likes: number;
};

export type MeData = {
  profile: UserProfile;
  stats: UserStats;
};

export type PublicProfileData = UserProfile & {
  counts: {
    post: number;
    followers: number;
    following: number;
    likes: number;
  };
  isFollowing: boolean;
  isMe: boolean;
};

export type PostItem = {
  id: number;
  caption: string | null;
  imageUrl: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe?: boolean;
  likedAt?: string;
  savedByMe?: boolean;
  author: UserSummary;
};

export type FeedData = {
  items: PostItem[];
  pagination: Pagination;
};

export type PostListData = {
  posts: PostItem[];
  pagination: Pagination;
};

export type CommentItem = {
  id: number;
  text: string;
  createdAt: string;
  author: UserSummary;
  isMine: boolean;
};

export type CommentListData = {
  comments: CommentItem[];
  pagination: Pagination;
};

export type UserListData = {
  users: UserSummary[];
  pagination: Pagination;
};

export type PostLikesData = UserListData;
export type SearchUsersData = UserListData;

export type AuthData = {
  token: string;
  user: UserProfile;
};
