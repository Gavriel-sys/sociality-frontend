import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SearchUser } from "@/features/users/types";
import { UserRow } from "./user-row";
import { UserRowSkeleton } from "./user-row-skeleton";

const mockUser: SearchUser = {
  id: "u-99",
  name: "Sarah Connor",
  username: "sconnor",
  avatarUrl: "https://example.com/avatar.jpg",
  bio: "Resistance leader & tech explorer",
};

describe("UserRow", () => {
  it("renders name, username, bio, and avatar correctly", () => {
    render(<UserRow user={mockUser} />);

    expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.getByText("@sconnor")).toBeInTheDocument();
    expect(screen.getByText("Resistance leader & tech explorer")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /view sarah connor's profile/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/profile/sconnor");
  });

  it("falls back to username if name is empty", () => {
    const userWithoutName: SearchUser = {
      id: "u-100",
      name: "",
      username: "ghost_rider",
    };
    render(<UserRow user={userWithoutName} />);

    expect(screen.getAllByText("ghost_rider")[0]).toBeInTheDocument();
    expect(screen.getByText("@ghost_rider")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view ghost_rider's profile/i })).toHaveAttribute(
      "href",
      "/profile/ghost_rider",
    );
  });

  it("omits bio section when bio is not provided", () => {
    const userWithoutBio: SearchUser = {
      id: "u-101",
      name: "Silent Bob",
      username: "silentbob",
    };
    const { container } = render(<UserRow user={userWithoutBio} />);

    expect(screen.getByText("Silent Bob")).toBeInTheDocument();
    expect(container.querySelector("p")).toBeNull();
  });
});

describe("UserRowSkeleton", () => {
  it("renders with status role, aria-busy true, and accessible loading label", () => {
    render(<UserRowSkeleton />);

    const skeleton = screen.getByRole("status", { name: /loading user/i });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading user...")).toBeInTheDocument();
  });
});
