export type UserProfile = {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type UserStats = {
  followers: number;
  following: number;
  likes: number;
  posts: number;
};

export type MeData = {
  profile: UserProfile;
  stats: UserStats;
};

export type PostUser = {
  id?: number;
  username?: string;
  name?: string;
  avatarUrl?: string | null;
};

export type PostItem = {
  id: number;
  caption?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  author?: PostUser;
  user?: PostUser;
};

export type FeedData = {
  items: PostItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CommentItem = {
  id: number;
  content?: string;
  comment?: string;
  text?: string;
  createdAt?: string;
  user?: PostUser;
  author?: PostUser;
};

export type UserPublicData = {
  profile: UserProfile;
  stats: UserStats;
  posts?: PostItem[];
  isFollowing?: boolean;
};
