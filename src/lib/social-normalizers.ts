import { resolveMediaUrl } from "@/lib/media";
import type {
  FeedData,
  Pagination,
  PostItem,
  PostListData,
  PublicProfileData,
  UserProfile,
  UserSummary,
} from "@/types/social";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }

  return {};
}

function readValue(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function readString(record: UnknownRecord, keys: string[]) {
  const value = readValue(record, keys);

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function readNumber(record: UnknownRecord, keys: string[], fallback = 0) {
  const value = readValue(record, keys);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function readBoolean(record: UnknownRecord, keys: string[]) {
  const value = readValue(record, keys);

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return undefined;
}

function readArray(record: UnknownRecord, keys: string[]) {
  const value = readValue(record, keys);
  return Array.isArray(value) ? value : [];
}

function numberFromUnknown(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function resolveUserAvatar(record: UnknownRecord) {
  const nestedProfile = asRecord(readValue(record, ["profile", "userProfile"]));

  return (
    resolveMediaUrl(
      readString(record, [
        "avatarUrl",
        "avatar",
        "profilePicture",
        "profile_picture",
        "profileImage",
        "profile_image",
        "photoUrl",
        "photo_url",
        "imageUrl",
        "image_url",
      ]),
    ) ??
    resolveMediaUrl(
      readString(nestedProfile, [
        "avatarUrl",
        "avatar",
        "profilePicture",
        "profile_picture",
        "profileImage",
        "profile_image",
        "photoUrl",
        "photo_url",
        "imageUrl",
        "image_url",
      ]),
    ) ??
    null
  );
}

export function normalizePagination(value: unknown): Pagination {
  const record = asRecord(value);

  return {
    page: readNumber(record, ["page"], 1),
    limit: readNumber(record, ["limit", "perPage", "per_page"], 20),
    total: readNumber(record, ["total", "count"], 0),
    totalPages: readNumber(record, ["totalPages", "total_pages"], 1),
  };
}

export function normalizeUserSummary(value: unknown): UserSummary {
  const record = asRecord(value);
  const username = readString(record, ["username", "userName"]) ?? "unknown";
  const name =
    readString(record, ["name", "fullName", "full_name"]) ?? username;

  return {
    id: readNumber(record, ["id", "userId", "user_id"], 0),
    username,
    name,
    avatarUrl: resolveUserAvatar(record),
    isFollowedByMe: readBoolean(record, [
      "isFollowedByMe",
      "is_followed_by_me",
      "isFollowing",
      "is_following",
    ]),
    followsMe: readBoolean(record, ["followsMe", "follows_me"]),
    isMe: readBoolean(record, ["isMe", "is_me"]),
  };
}

export function normalizeUserProfile(value: unknown): UserProfile {
  const record = asRecord(value);
  const counts = asRecord(record.counts);

  return {
    id: readNumber(record, ["id", "userId", "user_id"], 0),
    name:
      readString(record, ["name", "fullName", "full_name", "username"]) ??
      "User",
    username: readString(record, ["username", "userName"]) ?? "unknown",
    email: readString(record, ["email"]),
    phone: readString(record, ["phone"]),
    bio: readString(record, ["bio"]) ?? null,
    avatarUrl: resolveUserAvatar(record),
    createdAt: readString(record, ["createdAt", "created_at"]),
    postCount: readNumber(
      record,
      ["postCount", "post_count"],
      numberFromUnknown(counts.post),
    ),
    followersCount: readNumber(
      record,
      ["followersCount", "followers_count"],
      numberFromUnknown(counts.followers),
    ),
    followingsCount: readNumber(
      record,
      [
        "followingsCount",
        "followingCount",
        "followings_count",
        "following_count",
      ],
      numberFromUnknown(counts.following),
    ),
  };
}

export function normalizePublicProfile(value: unknown): PublicProfileData {
  const record = asRecord(value);
  const counts = asRecord(record.counts);
  const normalizedProfile = normalizeUserProfile(record);

  return {
    ...normalizedProfile,
    counts: {
      post: readNumber(
        counts,
        ["post", "posts"],
        normalizedProfile.postCount ?? 0,
      ),
      followers: readNumber(
        counts,
        ["followers"],
        normalizedProfile.followersCount ?? 0,
      ),
      following: readNumber(
        counts,
        ["following", "followings"],
        normalizedProfile.followingsCount ?? 0,
      ),
      likes: readNumber(counts, ["likes"], 0),
    },
    isFollowing:
      readBoolean(record, ["isFollowing", "is_following"]) ?? false,
    isMe: readBoolean(record, ["isMe", "is_me"]) ?? false,
  };
}

export function normalizePostItem(value: unknown): PostItem {
  const record = asRecord(value);
  const author = normalizeUserSummary(
    readValue(record, ["author", "user", "owner", "createdBy"]),
  );

  return {
    id: readNumber(record, ["id", "postId", "post_id"], 0),
    caption: readString(record, ["caption", "description", "text"]) ?? null,
    imageUrl:
      resolveMediaUrl(
        readString(record, [
          "imageUrl",
          "image_url",
          "image",
          "photoUrl",
          "photo_url",
          "mediaUrl",
          "media_url",
        ]),
      ) ?? null,
    createdAt:
      readString(record, ["createdAt", "created_at"]) ??
      new Date(0).toISOString(),
    likeCount: readNumber(
      record,
      ["likeCount", "likesCount", "like_count", "likes_count"],
      0,
    ),
    commentCount: readNumber(
      record,
      ["commentCount", "commentsCount", "comment_count", "comments_count"],
      0,
    ),
    likedByMe: readBoolean(record, [
      "likedByMe",
      "liked_by_me",
      "isLiked",
      "is_liked",
    ]),
    likedAt: readString(record, ["likedAt", "liked_at"]),
    savedByMe: readBoolean(record, [
      "savedByMe",
      "saved_by_me",
      "isSaved",
      "is_saved",
    ]),
    author,
  };
}

export function normalizeFeedData(value: unknown): FeedData {
  const record = asRecord(value);

  return {
    items: readArray(record, ["items", "posts"]).map(normalizePostItem),
    pagination: normalizePagination(record.pagination),
  };
}

export function normalizePostListData(value: unknown): PostListData {
  const record = asRecord(value);

  return {
    posts: readArray(record, ["posts", "items"]).map(normalizePostItem),
    pagination: normalizePagination(record.pagination),
  };
}
