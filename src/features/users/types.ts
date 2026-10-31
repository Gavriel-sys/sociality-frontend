export interface SearchUser {
  readonly id: string | number;
  readonly name: string;
  readonly username: string;
  readonly avatarUrl?: string;
  readonly bio?: string;
  readonly isFollowing?: boolean;
}

export interface SearchUsersResponse {
  readonly users: readonly SearchUser[];
  readonly total: number;
  readonly page?: number;
  readonly limit?: number;
}

function resolveSearchUserSource(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.user && typeof raw.user === "object" && raw.user !== null) {
    return raw.user as Record<string, unknown>;
  }
  if (raw.author && typeof raw.author === "object" && raw.author !== null) {
    return raw.author as Record<string, unknown>;
  }
  return raw;
}

export function normalizeSearchUser(raw: unknown): SearchUser {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid search user response: expected object.");
  }

  const envelope = raw as Record<string, unknown>;
  const source = resolveSearchUserSource(envelope);

  const rawId = source.id ?? source.userId ?? source._id ?? "";
  const rawName = source.name ?? source.fullName ?? source.displayName ?? "";
  const rawUsername = source.username ?? source.handle ?? source.user_name ?? "";
  const rawAvatar = source.avatarUrl ?? source.avatar ?? source.image ?? source.profilePicture;
  const rawBio = source.bio ?? source.biography ?? source.description;
  const isFollowing = source.isFollowing ?? envelope.isFollowing;

  const id = typeof rawId === "string" || typeof rawId === "number" ? rawId : String(rawId);
  const name = typeof rawName === "string" ? rawName : String(rawName);
  const username = typeof rawUsername === "string" ? rawUsername : String(rawUsername);
  const avatarUrl =
    typeof rawAvatar === "string" && rawAvatar.trim().length > 0 ? rawAvatar.trim() : undefined;
  const bio =
    typeof rawBio === "string" && rawBio.trim().length > 0 ? rawBio.trim() : undefined;

  return {
    id,
    name,
    username,
    avatarUrl,
    bio,
    ...(typeof isFollowing === "boolean" ? { isFollowing } : {}),
  };
}

function extractRawUserArray(candidate: Record<string, unknown>): readonly unknown[] {
  if (Array.isArray(candidate.users)) return candidate.users;
  if (Array.isArray(candidate.data)) return candidate.data;
  if (Array.isArray(candidate.results)) return candidate.results;
  if (Array.isArray(candidate.items)) return candidate.items;
  if (typeof candidate.data === "object" && candidate.data !== null) {
    const nested = candidate.data as Record<string, unknown>;
    if (Array.isArray(nested.users)) return nested.users;
    if (Array.isArray(nested.items)) return nested.items;
  }
  return [];
}

export function normalizeSearchUsersResponse(raw: unknown): SearchUsersResponse {
  if (Array.isArray(raw)) {
    const users = raw.map(normalizeSearchUser);
    return { users, total: users.length };
  }

  if (typeof raw !== "object" || raw === null) {
    return { users: [], total: 0 };
  }

  const record = raw as Record<string, unknown>;
  const rawItems = extractRawUserArray(record);
  const users = rawItems.map(normalizeSearchUser);

  const rawTotal = record.total ?? record.count;
  const total =
    typeof rawTotal === "number" && Number.isFinite(rawTotal) ? rawTotal : users.length;
  const page = typeof record.page === "number" ? record.page : undefined;
  const limit = typeof record.limit === "number" ? record.limit : undefined;

  return { users, total, page, limit };
}
