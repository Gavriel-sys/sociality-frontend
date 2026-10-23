export interface UserProfile {
  readonly id: string | number;
  readonly name: string;
  readonly username: string;
  readonly email?: string;
  readonly phone?: string;
  readonly bio?: string;
  readonly avatarUrl?: string;
  readonly postsCount: number;
  readonly followersCount: number;
  readonly followingCount: number;
}

export interface PublicUserProfile extends UserProfile {
  readonly isFollowing: boolean;
}

function resolveNestedSource(candidate: Record<string, unknown>): Record<string, unknown> {
  if (candidate.data && typeof candidate.data === "object") {
    return candidate.data as Record<string, unknown>;
  }
  if (candidate.user && typeof candidate.user === "object") {
    return candidate.user as Record<string, unknown>;
  }
  return candidate;
}

function resolveCounter(primary: unknown, fallback: unknown): number {
  if (typeof primary === "number") {
    return primary;
  }
  if (typeof fallback === "number") {
    return fallback;
  }
  return 0;
}

export function normalizeUserProfile(raw: unknown): UserProfile {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid user profile response: expected object.");
  }

  const envelope = raw as Record<string, unknown>;
  const source = resolveNestedSource(envelope);
  const counts = (source._count ?? {}) as Record<string, unknown>;

  const avatar =
    typeof source.avatarUrl === "string"
      ? source.avatarUrl
      : typeof source.avatar === "string"
        ? source.avatar
        : undefined;

  return {
    id: (source.id ?? "") as string | number,
    name: typeof source.name === "string" ? source.name : "",
    username: typeof source.username === "string" ? source.username : "",
    email: typeof source.email === "string" ? source.email : undefined,
    phone: typeof source.phone === "string" ? source.phone : undefined,
    bio: typeof source.bio === "string" ? source.bio : undefined,
    avatarUrl: avatar,
    postsCount: resolveCounter(source.postsCount, counts.posts),
    followersCount: resolveCounter(source.followersCount, counts.followers),
    followingCount: resolveCounter(source.followingCount, counts.following),
  };
}

export function normalizePublicUserProfile(raw: unknown): PublicUserProfile {
  const base = normalizeUserProfile(raw);
  const envelope = raw as Record<string, unknown>;
  const source = resolveNestedSource(envelope);

  const rawFollowing =
    source.isFollowing ??
    source.following ??
    source.is_following ??
    envelope.isFollowing ??
    envelope.following ??
    envelope.is_following;

  const isFollowing =
    typeof rawFollowing === "boolean"
      ? rawFollowing
      : typeof rawFollowing === "string"
        ? rawFollowing.toLowerCase() === "true" || rawFollowing === "1"
        : rawFollowing === 1;

  return {
    ...base,
    isFollowing,
  };
}
