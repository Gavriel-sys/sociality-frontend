import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { normalizePost, type Post } from "../types";
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/feed",
}));

const mockPost: Post = {
  id: "post-1", caption: "A sunny day in Tokyo!", imageUrl: "https://example.com/photo.jpg",
  createdAt: "2026-10-22T10:00:00.000Z",
  author: { id: "u-1", name: "Davis Explorer", username: "davis", avatarUrl: "https://example.com/avatar.jpg" },
  likesCount: 42, commentsCount: 7, isLiked: false, isSaved: false,
};

function renderWithProviders(ui: ReactNode, store?: AppStore) {
  const s = store ?? makeStore();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<Provider store={s}><QueryClientProvider client={qc}>{ui}</QueryClientProvider></Provider>);
}

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
        id: 99, text: "Nested content", photo: "/photo.png",
        user: { userId: "u2", fullName: "Sam", handle: "sammy" },
        _count: { likes: 15, comments: 4 }, liked: true, isBookmarked: true,
      },
    };
    const post = normalizePost(raw);
    expect(post.id).toBe(99);
    expect(post.caption).toBe("Nested content");
    expect(post.likesCount).toBe(15);
    expect(post.commentsCount).toBe(4);
    expect(post.isLiked).toBe(true);
    expect(post.isSaved).toBe(true);
  });
});

describe("PostCard component", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders author, relative date, image, counters, and caption", () => {
    renderWithProviders(<PostCard post={mockPost} />);
    expect(screen.getByText("Davis Explorer")).toBeInTheDocument();
    expect(screen.getByText("@davis")).toBeInTheDocument();
    expect(screen.getByText("A sunny day in Tokyo!")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Post image:/i })).toHaveAttribute("src", mockPost.imageUrl);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("handles like and save states with accessible labels", () => {
    const { rerender } = renderWithProviders(<PostCard post={mockPost} />);
    expect(screen.getByRole("button", { name: "Like post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save post" })).toBeInTheDocument();
    rerender(<PostCard post={{ ...mockPost, isLiked: true, isSaved: true }} />);
    expect(screen.getByRole("button", { name: "Unlike post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove from saved" })).toBeInTheDocument();
  });

  it("triggers custom action callbacks when passed instead of defaults", () => {
    const onLike = vi.fn();
    const onSave = vi.fn();
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");

    renderWithProviders(<PostCard post={mockPost} onLike={onLike} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Like post" }));
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(apiSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save post" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("triggers default mutation toggle when onLike and onSave are omitted", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ ok: true });
    const store = makeStore();
    store.dispatch(setSession({ token: "card-tok", sessionId: "card-sess", user: { username: "carduser" } }));

    renderWithProviders(<PostCard post={mockPost} />, store);
    fireEvent.click(screen.getByRole("button", { name: "Like post" }));
    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/post-1/like", method: "POST" }));
    });

    fireEvent.click(screen.getByRole("button", { name: "Save post" }));
    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/post-1/save", method: "POST" }));
    });
  });

  it("truncates long caption >120 chars and toggles Show more / Show less", () => {
    const longCaption = "This is a very long post caption designed to exceed one hundred and twenty characters limit to verify expand collapse toggle behavior properly.";
    renderWithProviders(<PostCard post={{ ...mockPost, caption: longCaption }} />);
    expect(screen.getByText(/Show more/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.getByText(/Show less/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getByText(/Show more/i)).toBeInTheDocument();
  });

  it("renders fallback box when image fails to load", () => {
    renderWithProviders(<PostCard post={mockPost} />);
    fireEvent.error(screen.getByRole("img", { name: /Post image:/i }));
    expect(screen.getByRole("img", { name: "Image failed to load" })).toBeInTheDocument();
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
  });
});

describe("PostCardSkeleton component", () => {
  it("renders loading status and aria-busy placeholder", () => {
    renderWithProviders(<PostCardSkeleton />);
    const skeleton = screen.getByRole("status", { name: "Loading post" });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-busy", "true");
  });
});
