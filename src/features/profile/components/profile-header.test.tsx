import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UserProfile } from "../types";
import { ProfileHeader } from "./profile-header";

vi.mock("@/features/auth/use-logout", () => ({
  useLogout: () => vi.fn(),
}));

const mockProfile: UserProfile = {
  id: "u-100",
  name: "Alex River",
  username: "alexriver",
  bio: "Frontend engineer building social apps.",
  avatarUrl: "https://example.com/alex.jpg",
  postsCount: 15,
  followersCount: 820,
  followingCount: 210,
};

describe("ProfileHeader", () => {
  it("renders display name, username, bio, and stats correctly", () => {
    render(<ProfileHeader profile={mockProfile} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Alex River" }),
    ).toBeInTheDocument();
    expect(screen.getByText("@alexriver")).toBeInTheDocument();
    expect(
      screen.getByText("Frontend engineer building social apps."),
    ).toBeInTheDocument();

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Posts")).toBeInTheDocument();
    expect(screen.getByText("820")).toBeInTheDocument();
    expect(screen.getByText("Followers")).toBeInTheDocument();
    expect(screen.getByText("210")).toBeInTheDocument();
    expect(screen.getByText("Following")).toBeInTheDocument();
  });

  it("triggers onFollowersClick and onFollowingClick callbacks", () => {
    const handleFollowers = vi.fn();
    const handleFollowing = vi.fn();
    render(
      <ProfileHeader
        profile={mockProfile}
        onFollowersClick={handleFollowers}
        onFollowingClick={handleFollowing}
      />,
    );

    const followersBtn = screen.getByRole("button", { name: "820 Followers" });
    expect(followersBtn).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(followersBtn);
    expect(handleFollowers).toHaveBeenCalledTimes(1);

    const followingBtn = screen.getByRole("button", { name: "210 Following" });
    expect(followingBtn).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(followingBtn);
    expect(handleFollowing).toHaveBeenCalledTimes(1);
  });

  it("displays placeholder bio when bio is not provided", () => {
    const noBioProfile: UserProfile = {
      ...mockProfile,
      bio: undefined,
    };
    render(<ProfileHeader profile={noBioProfile} />);

    expect(screen.getByText("No bio yet")).toBeInTheDocument();
  });

  it("renders initials fallback when avatarUrl is undefined", () => {
    const noAvatarProfile: UserProfile = {
      ...mockProfile,
      avatarUrl: undefined,
    };
    render(<ProfileHeader profile={noAvatarProfile} />);

    expect(screen.getByText("AR")).toBeInTheDocument();
  });

  it("invokes onEditProfile callback when Edit profile button is clicked", () => {
    const handleEditProfile = vi.fn();
    render(<ProfileHeader profile={mockProfile} onEditProfile={handleEditProfile} />);

    const editBtn = screen.getByRole("button", { name: /Edit profile/i });
    expect(editBtn).toBeEnabled();
    fireEvent.click(editBtn);

    expect(handleEditProfile).toHaveBeenCalledTimes(1);
  });

  it("invokes onLogout callback when Log out button is clicked", () => {
    const handleLogout = vi.fn();
    render(<ProfileHeader profile={mockProfile} onLogout={handleLogout} />);

    const logoutBtn = screen.getByRole("button", { name: /Log out/i });
    fireEvent.click(logoutBtn);

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
