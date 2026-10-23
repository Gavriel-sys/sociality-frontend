import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicUserProfile } from "../types";
import { PublicProfileHeader } from "./public-profile-header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/profile/sarahc",
}));

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
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  function renderWithClient(ui: ReactNode) {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  }

  it("renders user identity, bio, and avatar photo", () => {
    renderWithClient(<PublicProfileHeader profile={mockProfile} />);
    expect(screen.getByRole("heading", { level: 1, name: "Sarah Connor" })).toBeInTheDocument();
    expect(screen.getByText("@sarahc")).toBeInTheDocument();
    expect(screen.getByText("Resistance fighter.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Sarah Connor's profile photo" })).toBeInTheDocument();
  });

  it("renders fallback text when bio is absent", () => {
    renderWithClient(<PublicProfileHeader profile={{ ...mockProfile, bio: undefined }} />);
    expect(screen.getByText("No bio yet")).toBeInTheDocument();
  });

  it("renders stats row with clickable followers and following buttons", () => {
    const onFollowersClick = vi.fn();
    const onFollowingClick = vi.fn();
    renderWithClient(
      <PublicProfileHeader
        profile={mockProfile}
        onFollowersClick={onFollowersClick}
        onFollowingClick={onFollowingClick}
      />,
    );

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Posts")).toBeInTheDocument();

    const followersBtn = screen.getByRole("button", { name: "1200 Followers" });
    expect(followersBtn).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(followersBtn);
    expect(onFollowersClick).toHaveBeenCalledTimes(1);

    const followingBtn = screen.getByRole("button", { name: "300 Following" });
    expect(followingBtn).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(followingBtn);
    expect(onFollowingClick).toHaveBeenCalledTimes(1);
  });

  it("renders Follow button when not following and triggers onFollowToggle", () => {
    const handleToggle = vi.fn();
    renderWithClient(<PublicProfileHeader profile={mockProfile} onFollowToggle={handleToggle} />);
    const followBtn = screen.getByRole("button", { name: "Follow" });
    fireEvent.click(followBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("renders Following button when isFollowing is true", () => {
    renderWithClient(<PublicProfileHeader profile={{ ...mockProfile, isFollowing: true }} />);
    expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument();
  });

  it("renders Edit profile when isSelf is true", () => {
    renderWithClient(<PublicProfileHeader profile={mockProfile} isSelf={true} />);
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Follow" })).not.toBeInTheDocument();
  });
});
