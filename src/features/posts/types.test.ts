import { describe, expect, it } from "vitest";
import { normalizePost } from "./types";

describe("Railway post counters", () => {
  it("reads singular counters before legacy aliases and nested counts", () => {
    const post = normalizePost({ data: {
      id: 42, likeCount: 8, likesCount: 90, commentCount: 3, commentsCount: 40,
      _count: { likes: 100, comments: 100 },
    } });

    expect(post.likesCount).toBe(8);
    expect(post.commentsCount).toBe(3);
  });

  it("preserves explicit zero counters", () => {
    const post = normalizePost({ likeCount: 0, likesCount: 5, commentCount: 0, commentsCount: 2 });

    expect(post.likesCount).toBe(0);
    expect(post.commentsCount).toBe(0);
  });

  it.each([
    { likesCount: 4, commentsCount: 2 },
    { likes_count: 4, comments_count: 2 },
    { _count: { likes: 4, comments: 2 } },
  ])("retains legacy counter support: %o", (response) => {
    expect(normalizePost(response)).toMatchObject({ likesCount: 4, commentsCount: 2 });
  });
});
