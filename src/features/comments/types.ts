import { z } from "zod";

export interface CommentAuthor {
  readonly id: string | number;
  readonly name: string;
  readonly username: string;
  readonly avatarUrl?: string;
}

export interface Comment {
  readonly id: string | number;
  readonly content: string;
  readonly createdAt: string;
  readonly author: CommentAuthor;
}

export const commentInputSchema = z
  .string()
  .trim()
  .min(1, "Comment cannot be empty")
  .max(500, "Comment is too long");

export type CommentInput = z.infer<typeof commentInputSchema>;

export function postCommentsQueryKey(postId: string | number) {
  return ["public", "post", String(postId), "comments"] as const;
}

function resolveEnvelope(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.comment && typeof raw.comment === "object") return raw.comment as Record<string, unknown>;
  if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
    return raw.data as Record<string, unknown>;
  }
  return raw;
}

function resolveAuthor(source: Record<string, unknown>): CommentAuthor {
  const candidate = (source.author ?? source.user ?? {}) as Record<string, unknown>;
  const rawId = candidate.id ?? candidate.userId ?? source.authorId ?? source.userId ?? "";
  const rawName = candidate.name ?? candidate.fullName ?? source.authorName ?? candidate.username ?? "";
  const rawUsername = candidate.username ?? candidate.handle ?? source.authorUsername ?? "";
  const rawAvatar = candidate.avatarUrl ?? candidate.avatar ?? candidate.avatar_url ?? source.authorAvatar;

  return {
    id: (rawId ?? "") as string | number,
    name: typeof rawName === "string" ? rawName : "",
    username: typeof rawUsername === "string" ? rawUsername : "",
    avatarUrl: typeof rawAvatar === "string" && rawAvatar.length > 0 ? rawAvatar : undefined,
  };
}

export function normalizeComment(raw: unknown): Comment {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid comment response: expected object.");
  }

  const envelope = raw as Record<string, unknown>;
  const source = resolveEnvelope(envelope);

  const content = typeof source.content === "string" ? source.content
    : typeof source.text === "string" ? source.text
    : typeof source.message === "string" ? source.message
    : "";

  const createdAt = typeof source.createdAt === "string" ? source.createdAt
    : typeof source.created_at === "string" ? source.created_at
    : typeof source.date === "string" ? source.date
    : "";

  return {
    id: (source.id ?? "") as string | number,
    content,
    createdAt,
    author: resolveAuthor(source),
  };
}

export function normalizeCommentList(raw: unknown): readonly Comment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(normalizeComment);
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.comments)) {
      return obj.comments.map(normalizeComment);
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map(normalizeComment);
    }
    if (obj.data && typeof obj.data === "object") {
      const nested = obj.data as Record<string, unknown>;
      if (Array.isArray(nested.comments)) {
        return nested.comments.map(normalizeComment);
      }
    }
  }
  return [];
}
