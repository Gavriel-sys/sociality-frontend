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
  readonly likesCount: number;
}

export interface PublicUserProfile extends UserProfile {
  readonly isFollowing: boolean;
}

function resolveNestedSource(candidate: Record<string, unknown>): Record<string, unknown> {
  for (const key of ["data", "user", "profile"]) {
    const nested = candidate[key];
    if (isRecord(nested)) {
      return { ...candidate, ...resolveNestedSource(nested) };
    }
  }
  return candidate;
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}

function resolveCounter(...candidates: unknown[]): number {
  return candidates.find((candidate): candidate is number =>
    typeof candidate === "number" && Number.isFinite(candidate),
  ) ?? 0;
}

function resolveProfileCounters(source: Record<string, unknown>) {
  const stats = isRecord(source.stats) ? source.stats : {};
  const counts = isRecord(source._count) ? source._count : {};
  return {
    postsCount: resolveCounter(source.postsCount, stats.posts, counts.posts),
    followersCount: resolveCounter(source.followersCount, stats.followers, counts.followers),
    followingCount: resolveCounter(source.followingCount, stats.following, counts.following),
    likesCount: resolveCounter(source.likesCount, stats.likes, counts.likes),
  };
}

export function normalizeUserProfile(raw: unknown): UserProfile {
  if (!isRecord(raw)) {
    throw new Error("Invalid user profile response: expected object.");
  }

  const source = resolveNestedSource(raw);

  const avatar =
    typeof source.avatarUrl === "string"
      ? source.avatarUrl
      : typeof source.avatar === "string"
        ? source.avatar
        : undefined;

  return {
    id: typeof source.id === "string" || typeof source.id === "number" ? source.id : "",
    name: typeof source.name === "string" ? source.name : "",
    username: typeof source.username === "string" ? source.username : "",
    email: typeof source.email === "string" ? source.email : undefined,
    phone: typeof source.phone === "string" ? source.phone : undefined,
    bio: typeof source.bio === "string" ? source.bio : undefined,
    avatarUrl: avatar,
    ...resolveProfileCounters(source),
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
