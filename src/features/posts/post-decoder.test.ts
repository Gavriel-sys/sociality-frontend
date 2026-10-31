import { describe, expect, it } from "vitest";
import { normalizePost } from "./types";

describe("normalizePost decoder", () => {
  it("throws error for non-object or null input", () => {
    expect(() => normalizePost(null)).toThrow("Invalid post response");
    expect(() => normalizePost("not-an-object")).toThrow("Invalid post response");
  });

  it("decodes minimal post with default counts and booleans", () => {
    const post = normalizePost({ id: "p1", imageUrl: "/img.jpg", author: { id: "a1", name: "Alex", username: "alex" } });
    expect(post.likesCount).toBe(0);
    expect(post.commentsCount).toBe(0);
  });

  it("decodes nested envelope with Prisma _count and alternative keys", () => {
    const response = {
      data: {
        id: 99, text: "Nested content", photo: "/photo.png",
        user: { userId: "u2", fullName: "Sam", handle: "sammy" },
        _count: { likes: 15, comments: 4 }, liked: true, isBookmarked: true,
      },
    };
    const post = normalizePost(response);
    expect(post.id).toBe(99);
    expect(post.caption).toBe("Nested content");
    expect(post.likesCount).toBe(15);
  });
});
