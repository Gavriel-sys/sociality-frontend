import { describe, expect, it } from "vitest";
import { normalizePublicUserProfile, normalizeUserProfile } from "./types";

const profile = {
  id: 42, name: "John Doe", username: "johndoe", email: "john@example.com",
  phone: "12345", bio: "Creating unforgettable moments", avatarUrl: "/avatar.jpg",
};
const stats = { posts: 50, followers: 100, following: 43, likes: 567 };

describe("profile response normalization", () => {
  it.each([
    { success: true, data: { profile, stats } },
    { profile, stats },
    { data: { user: profile, stats } },
  ])("extracts profile fields and sibling stats from %o", (response) => {
    expect(normalizeUserProfile(response)).toEqual({
      ...profile, postsCount: 50, followersCount: 100, followingCount: 43, likesCount: 567,
    });
  });

  it("keeps flat counters and legacy _count fallbacks", () => {
    expect(normalizeUserProfile({ ...profile, postsCount: 8, stats, _count: { followers: 5 } }))
      .toMatchObject({ postsCount: 8, followersCount: 100, followingCount: 43, likesCount: 567 });
    expect(normalizeUserProfile({ user: { ...profile, _count: stats } }))
      .toMatchObject({ postsCount: 50, followersCount: 100, followingCount: 43, likesCount: 567 });
  });

  it("defaults absent or invalid counters to zero", () => {
    expect(normalizeUserProfile({ profile, stats: { likes: "bad" } }))
      .toMatchObject({ postsCount: 0, followersCount: 0, followingCount: 0, likesCount: 0 });
  });

  it("preserves public following metadata outside the nested profile", () => {
    expect(normalizePublicUserProfile({ data: { profile, stats, isFollowing: true } }))
      .toMatchObject({ username: "johndoe", likesCount: 567, isFollowing: true });
  });
});
