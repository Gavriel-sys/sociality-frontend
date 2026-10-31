export interface PostAuthor {
  readonly id: string | number;
  readonly name: string;
  readonly username: string;
  readonly avatarUrl?: string;
}

export interface Post {
  readonly id: string | number;
  readonly caption: string;
  readonly imageUrl: string;
  readonly createdAt: string;
  readonly author: PostAuthor;
  readonly likesCount: number;
  readonly commentsCount: number;
  readonly isLiked: boolean;
  readonly isSaved: boolean;
}

export interface PaginatedPosts {
  readonly posts: readonly Post[];
  readonly nextPage?: number | string;
  readonly hasMore: boolean;
  readonly total?: number;
}

function resolveEnvelope(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.post && typeof raw.post === "object") return raw.post as Record<string, unknown>;
  if (raw.data && typeof raw.data === "object") return raw.data as Record<string, unknown>;
  return raw;
}

function resolveAuthor(source: Record<string, unknown>): PostAuthor {
  const candidate = (source.author ?? source.user ?? {}) as Record<string, unknown>;
  const rawId = candidate.id ?? candidate.userId ?? source.authorId ?? source.userId ?? "";
  const rawName = candidate.name ?? candidate.fullName ?? source.authorName ?? "";
  const rawUsername = candidate.username ?? candidate.handle ?? source.authorUsername ?? "";
  const rawAvatar = candidate.avatarUrl ?? candidate.avatar ?? source.authorAvatar;

  return {
    id: rawId as string | number,
    name: typeof rawName === "string" ? rawName : "",
    username: typeof rawUsername === "string" ? rawUsername : "",
    avatarUrl: typeof rawAvatar === "string" && rawAvatar.length > 0 ? rawAvatar : undefined,
  };
}

function resolveCounter(primary: unknown, secondary: unknown): number {
  if (typeof primary === "number" && Number.isFinite(primary)) return primary;
  if (typeof secondary === "number" && Number.isFinite(secondary)) return secondary;
  if (Array.isArray(primary)) return primary.length;
  if (Array.isArray(secondary)) return secondary.length;
  return 0;
}

export function normalizePost(raw: unknown): Post {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid post response: expected object.");
  }

  const source = resolveEnvelope(raw as Record<string, unknown>);
  const counts = (source._count ?? {}) as Record<string, unknown>;

  const imageUrl = typeof source.imageUrl === "string" ? source.imageUrl
    : typeof source.image === "string" ? source.image
    : typeof source.photo === "string" ? source.photo
    : typeof source.url === "string" ? source.url
    : "";

  const caption = typeof source.caption === "string" ? source.caption
    : typeof source.text === "string" ? source.text
    : typeof source.content === "string" ? source.content
    : "";

  const createdAt = typeof source.createdAt === "string" ? source.createdAt
    : typeof source.created_at === "string" ? source.created_at
    : typeof source.date === "string" ? source.date
    : "";

  return {
    id: (source.id ?? "") as string | number,
    caption,
    imageUrl,
    createdAt,
    author: resolveAuthor(source),
    likesCount: resolveCounter(source.likeCount ?? source.likesCount ?? source.likes_count, counts.likes),
    commentsCount: resolveCounter(source.commentCount ?? source.commentsCount ?? source.comments_count, counts.comments),
    isLiked: Boolean(source.isLiked ?? source.likedByMe ?? source.liked ?? source.is_liked),
    isSaved: Boolean(source.isSaved ?? source.saved ?? source.is_saved ?? source.isBookmarked),
  };
}
