import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Comment } from "../types";
import { CommentRow } from "./comment-row";

const mockComment: Comment = {
  id: "comm-1",
  content: "This is an insightful comment on the post.",
  createdAt: "2026-10-24T12:00:00Z",
  author: {
    id: "user-42",
    name: "Jane Doe",
    username: "janedoe",
    avatarUrl: "https://example.com/jane.jpg",
  },
};

describe("CommentRow", () => {
  it("renders author username, content, and relative timestamp", () => {
    render(<CommentRow comment={mockComment} />);

    expect(screen.getByText("janedoe")).toBeInTheDocument();
    expect(screen.getByText("This is an insightful comment on the post.")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Comment by janedoe" })).toBeInTheDocument();
  });

  it("links avatar and username to the author's profile page", () => {
    render(<CommentRow comment={mockComment} />);

    const profileLinks = screen.getAllByRole("link");
    expect(profileLinks[0]).toHaveAttribute("href", "/profile/janedoe");
    expect(profileLinks[1]).toHaveAttribute("href", "/profile/janedoe");
  });

  it("renders avatar fallback initials when avatarUrl is absent", () => {
    const commentWithoutAvatar: Comment = {
      ...mockComment,
      author: { id: "user-43", name: "Bob Smith", username: "bobsmith" },
    };

    render(<CommentRow comment={commentWithoutAvatar} />);
    expect(screen.getByText("BS")).toBeInTheDocument();
    expect(screen.getByText("bobsmith")).toBeInTheDocument();
  });

  it("falls back to author name when username is empty", () => {
    const commentWithoutUsername: Comment = {
      ...mockComment,
      author: { id: "user-44", name: "Anonymous", username: "" },
    };

    render(<CommentRow comment={commentWithoutUsername} />);
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });
});
