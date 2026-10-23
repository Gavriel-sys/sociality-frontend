import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FollowButton } from "./follow-button";

describe("FollowButton", () => {
  it("renders Follow state when not following and calls onClick", () => {
    const handleClick = vi.fn();
    render(<FollowButton isFollowing={false} onClick={handleClick} />);

    const button = screen.getByRole("button", { name: "Follow" });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-[#6936F2]");

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders Following state when following and switches to Unfollow on hover", () => {
    const handleClick = vi.fn();
    render(<FollowButton isFollowing={true} onClick={handleClick} />);

    const button = screen.getByRole("button", { name: "Following" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Following");

    fireEvent.mouseEnter(button);
    expect(screen.getByRole("button", { name: "Unfollow" })).toHaveTextContent("Unfollow");

    fireEvent.mouseLeave(button);
    expect(screen.getByRole("button", { name: "Following" })).toHaveTextContent("Following");

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders Edit profile when isSelf is true", () => {
    const handleClick = vi.fn();
    render(<FollowButton isFollowing={false} isSelf={true} onClick={handleClick} />);

    const button = screen.getByRole("button", { name: "Edit profile" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Edit profile");

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disables button and displays loading state when isLoading is true", () => {
    render(<FollowButton isFollowing={false} isLoading={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("meets touch target requirement with minimum 44px height", () => {
    render(<FollowButton isFollowing={false} />);
    const button = screen.getByRole("button", { name: "Follow" });
    expect(button.className).toContain("min-h-[44px]");
  });
});
