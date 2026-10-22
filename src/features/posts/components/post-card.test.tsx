import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";
import { normalizePost, type Post } from "../types";

const mockPost: Post = {
  id: "post-1",
  caption: "A sunny day in Tokyo!",
  imageUrl: "https://example.com/photo.jpg",
  createdAt: "2026-10-22T10:00:00.000Z",
  author: { id: "u-1", name: "Davis Explorer", username: "davis", avatarUrl: "https://example.com/avatar.jpg" },
  likesCount: 42,
  commentsCount: 7,
  isLiked: false,
  isSaved: false,
};

describe("normalizePost decoder", () => {
  it("throws error for non-object or null input", () => {
    expect(() => normalizePost(null)).toThrow("Invalid post response");
    expect(() => normalizePost("not-an-object")).toThrow("Invalid post response");
  });

  it("decodes minimal post with default counts and booleans", () => {
    const post = normalizePost({ id: "p1", imageUrl: "/img.jpg", author: { id: "a1", name: "Alex", username: "alex" } });
    expect(post.likesCount).toBe(0);
    expect(post.commentsCount).toBe(0);
    expect(post.isLiked).toBe(false);
    expect(post.isSaved).toBe(false);
  });

  it("decodes nested envelope with Prisma _count and alternative keys", () => {
    const raw = {
      data: {
        id: 99,
        text: "Nested content",
        photo: "/photo.png",
        user: { userId: "u2", fullName: "Sam", handle: "sammy" },
        _count: { likes: 15, comments: 4 },
        liked: true,
        isBookmarked: true,
      },
    };
    const post = normalizePost(raw);
    expect(post.id).toBe(99);
    expect(post.caption).toBe("Nested content");
    expect(post.imageUrl).toBe("/photo.png");
    expect(post.author.name).toBe("Sam");
    expect(post.author.username).toBe("sammy");
    expect(post.likesCount).toBe(15);
    expect(post.commentsCount).toBe(4);
    expect(post.isLiked).toBe(true);
    expect(post.isSaved).toBe(true);
  });
});

describe("PostCard component", () => {
  it("renders author name, username, relative date, image, counters, and caption", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Davis Explorer")).toBeInTheDocument();
    expect(screen.getByText("@davis")).toBeInTheDocument();
    expect(screen.getByText("A sunny day in Tokyo!")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Post image:/i })).toHaveAttribute("src", mockPost.imageUrl);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("handles like and save states with accessible labels", () => {
    const { rerender } = render(<PostCard post={mockPost} />);
    expect(screen.getByRole("button", { name: "Like post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save post" })).toBeInTheDocument();

    rerender(<PostCard post={{ ...mockPost, isLiked: true, isSaved: true }} />);
    expect(screen.getByRole("button", { name: "Unlike post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove from saved" })).toBeInTheDocument();
  });

  it("triggers action callbacks when buttons are clicked", () => {
    const onLike = vi.fn();
    const onComment = vi.fn();
    const onShare = vi.fn();
    const onSave = vi.fn();

    render(<PostCard post={mockPost} onLike={onLike} onComment={onComment} onShare={onShare} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Like post" }));
    expect(onLike).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "View comments" }));
    expect(onComment).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Share post" }));
    expect(onShare).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Save post" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("truncates long caption >120 chars and toggles Show more / Show less", () => {
    const longCaption = "This is a very long post caption designed to exceed one hundred and twenty characters limit to verify expand collapse toggle behavior properly.";
    render(<PostCard post={{ ...mockPost, caption: longCaption }} />);

    expect(screen.getByText(/Show more/i)).toBeInTheDocument();
    expect(screen.queryByText(/Show less/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.getByText(/Show less/i)).toBeInTheDocument();
    expect(screen.getByText(longCaption)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getByText(/Show more/i)).toBeInTheDocument();
  });

  it("renders fallback box when image fails to load", () => {
    render(<PostCard post={mockPost} />);
    const img = screen.getByRole("img", { name: /Post image:/i });
    fireEvent.error(img);
    expect(screen.getByRole("img", { name: "Image failed to load" })).toBeInTheDocument();
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
  });
});

describe("PostCardSkeleton component", () => {
  it("renders loading status and aria-busy placeholder", () => {
    render(<PostCardSkeleton />);
    const skeleton = screen.getByRole("status", { name: "Loading post" });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-busy", "true");
  });
});
