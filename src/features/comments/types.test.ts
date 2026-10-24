import { describe, expect, it } from "vitest";
import {
  commentInputSchema,
  normalizeComment,
  normalizeCommentList,
  postCommentsQueryKey,
} from "./types";

describe("commentInputSchema", () => {
  it("rejects empty string with designated message", () => {
    const result = commentInputSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Comment cannot be empty");
    }
  });

  it("rejects whitespace-only string after trimming", () => {
    const result = commentInputSchema.safeParse("    ");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Comment cannot be empty");
    }
  });

  it("rejects strings exceeding 500 characters", () => {
    const tooLong = "a".repeat(501);
    const result = commentInputSchema.safeParse(tooLong);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Comment is too long");
    }
  });

  it("accepts valid comments and trims whitespace", () => {
    const result = commentInputSchema.safeParse("   Hello world!   ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("Hello world!");
    }
  });
});

describe("postCommentsQueryKey", () => {
  it("generates correct public post comments query key", () => {
    expect(postCommentsQueryKey("42")).toEqual(["public", "post", "42", "comments"]);
    expect(postCommentsQueryKey(99)).toEqual(["public", "post", "99", "comments"]);
  });
});

describe("normalizeComment", () => {
  it("normalizes a standard comment object", () => {
    const raw = {
      id: "c-1",
      content: "Nice picture!",
      createdAt: "2026-10-24T12:00:00Z",
      author: {
        id: "u-1",
        name: "Alice",
        username: "alice",
        avatarUrl: "https://example.com/alice.jpg",
      },
    };
    const normalized = normalizeComment(raw);
    expect(normalized.id).toBe("c-1");
    expect(normalized.content).toBe("Nice picture!");
    expect(normalized.createdAt).toBe("2026-10-24T12:00:00Z");
    expect(normalized.author.username).toBe("alice");
    expect(normalized.author.avatarUrl).toBe("https://example.com/alice.jpg");
  });

  it("handles key variations like user, text, created_at, avatar", () => {
    const raw = {
      id: 10,
      text: "Variant text",
      created_at: "2026-10-24T10:00:00Z",
      user: {
        userId: "u-2",
        fullName: "Bob Ross",
        handle: "bobross",
        avatar: "https://example.com/bob.jpg",
      },
    };
    const normalized = normalizeComment(raw);
    expect(normalized.id).toBe(10);
    expect(normalized.content).toBe("Variant text");
    expect(normalized.createdAt).toBe("2026-10-24T10:00:00Z");
    expect(normalized.author.name).toBe("Bob Ross");
    expect(normalized.author.username).toBe("bobross");
    expect(normalized.author.avatarUrl).toBe("https://example.com/bob.jpg");
  });

  it("unwraps envelopes from comment or data properties", () => {
    const envelope = {
      comment: {
        id: "c-3",
        content: "Enveloped comment",
        createdAt: "2026-10-24T11:00:00Z",
        author: { id: "u-3", name: "Carol", username: "carol" },
      },
    };
    const normalized = normalizeComment(envelope);
    expect(normalized.id).toBe("c-3");
    expect(normalized.content).toBe("Enveloped comment");
  });

  it("throws an error when input is not an object or is null", () => {
    expect(() => normalizeComment(null)).toThrow("Invalid comment response: expected object.");
    expect(() => normalizeComment("invalid")).toThrow("Invalid comment response: expected object.");
  });
});

describe("normalizeCommentList", () => {
  const sample = {
    id: "c-1",
    content: "Hi",
    createdAt: "2026-10-24T00:00:00Z",
    author: { id: "u-1", name: "User", username: "user" },
  };

  it("normalizes a raw array of comments", () => {
    const list = normalizeCommentList([sample]);
    expect(list).toHaveLength(1);
    expect(list[0]?.content).toBe("Hi");
  });

  it("normalizes comments inside a { comments: [...] } envelope", () => {
    const list = normalizeCommentList({ comments: [sample] });
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe("c-1");
  });

  it("normalizes comments inside a { data: [...] } envelope", () => {
    const list = normalizeCommentList({ data: [sample] });
    expect(list).toHaveLength(1);
  });

  it("normalizes comments inside a { data: { comments: [...] } } nested envelope", () => {
    const list = normalizeCommentList({ data: { comments: [sample] } });
    expect(list).toHaveLength(1);
  });

  it("returns an empty array when given null, undefined, or empty objects", () => {
    expect(normalizeCommentList(null)).toEqual([]);
    expect(normalizeCommentList(undefined)).toEqual([]);
    expect(normalizeCommentList({})).toEqual([]);
    expect(normalizeCommentList("string")).toEqual([]);
  });
});
