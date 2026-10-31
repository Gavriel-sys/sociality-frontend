import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SearchUser } from "@/features/users/types";
import { UserListDialog } from "./user-list-dialog";

const mockUsers: readonly SearchUser[] = [
  { id: "u-1", name: "Alice Wonderland", username: "alice", avatarUrl: "https://example.com/alice.jpg", bio: "Curious adventurer" },
  { id: "u-2", name: "Bob Builder", username: "bob", bio: "Can we fix it?" },
];

describe("UserListDialog", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <UserListDialog
        isOpen={false}
        onClose={vi.fn()}
        title="Followers"
        users={mockUsers}
        isLoading={false}
        isError={false}
        emptyMessage="No followers yet"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title, close button, and calls onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(
      <UserListDialog
        isOpen={true}
        onClose={handleClose}
        title="Followers"
        users={mockUsers}
        isLoading={false}
        isError={false}
        emptyMessage="No followers yet"
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Followers" })).toBeInTheDocument();
    const closeBtn = screen.getByRole("button", { name: "Close dialog" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders 4 skeletons when isLoading is true", () => {
    render(
      <UserListDialog
        isOpen={true}
        onClose={vi.fn()}
        title="Followers"
        users={[]}
        isLoading={true}
        isError={false}
        emptyMessage="No followers yet"
      />,
    );

    expect(screen.getByLabelText("Loading followers")).toBeInTheDocument();
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBe(4);
  });

  it("renders error state when isError is true and handles onRetry", () => {
    const handleRetry = vi.fn();
    render(
      <UserListDialog
        isOpen={true}
        onClose={vi.fn()}
        title="Following"
        users={[]}
        isLoading={false}
        isError={true}
        emptyMessage="Not following anyone yet"
        onRetry={handleRetry}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Failed to load following")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Try again/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when users array is empty", () => {
    render(
      <UserListDialog
        isOpen={true}
        onClose={vi.fn()}
        title="Followers"
        users={[]}
        isLoading={false}
        isError={false}
        emptyMessage="This user does not have any followers yet."
      />,
    );

    expect(screen.getByRole("heading", { name: "No followers yet" })).toBeInTheDocument();
    expect(screen.getByText("This user does not have any followers yet.")).toBeInTheDocument();
  });

  it("renders user rows and calls onClose when a row is clicked", () => {
    const handleClose = vi.fn();
    render(
      <UserListDialog
        isOpen={true}
        onClose={handleClose}
        title="Followers"
        users={mockUsers}
        isLoading={false}
        isError={false}
        emptyMessage="No followers yet"
      />,
    );

    expect(screen.getByText("Alice Wonderland")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();

    const aliceLink = screen.getByRole("link", { name: /View Alice Wonderland's profile/i });
    expect(aliceLink).toHaveAttribute("href", "/profile/alice");
    aliceLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(aliceLink);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
