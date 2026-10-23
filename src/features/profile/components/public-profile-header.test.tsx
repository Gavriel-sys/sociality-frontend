import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicUserProfile } from "../types";
import { PublicProfileHeader } from "./public-profile-header";

const mockProfile: PublicUserProfile = {
  id: "user-123",
  name: "Sarah Connor",
  username: "sarahc",
  bio: "Resistance fighter.",
  avatarUrl: "https://example.com/avatar.jpg",
  postsCount: 42,
  followersCount: 1200,
  followingCount: 300,
  isFollowing: false,
};

describe("PublicProfileHeader", () => {
  it("renders user identity, bio, and avatar photo", () => {
    render(<PublicProfileHeader profile={mockProfile} />);

    expect(screen.getByRole("heading", { level: 1, name: "Sarah Connor" })).toBeInTheDocument();
    expect(screen.getByText("@sarahc")).toBeInTheDocument();
    expect(screen.getByText("Resistance fighter.")).toBeInTheDocument();

    const img = screen.getByRole("img", { name: "Sarah Connor's profile photo" });
    expect(img).toBeInTheDocument();
  });

  it("renders fallback text when bio is absent", () => {
    const profileWithoutBio: PublicUserProfile = {
      ...mockProfile,
      bio: undefined,
    };
    render(<PublicProfileHeader profile={profileWithoutBio} />);

    expect(screen.getByText("No bio yet")).toBeInTheDocument();
  });

  it("renders stats row with posts, followers, and following counters", () => {
    render(<PublicProfileHeader profile={mockProfile} />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Posts")).toBeInTheDocument();
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("Followers")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("Following")).toBeInTheDocument();
  });

  it("renders Follow button when not following and triggers onFollowToggle", () => {
    const handleToggle = vi.fn();
    render(<PublicProfileHeader profile={mockProfile} onFollowToggle={handleToggle} />);

    const followBtn = screen.getByRole("button", { name: "Follow" });
    expect(followBtn).toBeInTheDocument();

    fireEvent.click(followBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("renders Following button when isFollowing is true", () => {
    const followingProfile: PublicUserProfile = {
      ...mockProfile,
      isFollowing: true,
    };
    render(<PublicProfileHeader profile={followingProfile} />);

    expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument();
  });

  it("renders Edit profile when isSelf is true", () => {
    render(<PublicProfileHeader profile={mockProfile} isSelf={true} />);

    expect(screen.getByRole("button", { name: "Edit profile" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Follow" })).not.toBeInTheDocument();
  });
});
