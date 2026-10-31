import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import type { Post } from "../types";
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
  const activeStore = store ?? makeStore();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<Provider store={activeStore}><QueryClientProvider client={queryClient}>{ui}</QueryClientProvider></Provider>);
}

describe("PostCard component", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders author, relative date, image, counters, and caption", () => {
    renderWithProviders(<PostCard post={mockPost} />);
    expect(screen.getByText("Davis Explorer")).toBeInTheDocument();
    expect(screen.getByText("@davis")).toBeInTheDocument();
    expect(screen.getByText("A sunny day in Tokyo!")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Post image:/i })).toHaveAttribute("src", mockPost.imageUrl);
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
    const onComment = vi.fn();
    renderWithProviders(<PostCard post={mockPost} onLike={onLike} onSave={onSave} onComment={onComment} />);
    fireEvent.click(screen.getByRole("button", { name: "Like post" }));
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save post" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "View comments" }));
    expect(onComment).toHaveBeenCalledTimes(1);
  });

  it("opens comments dialog when comment button is clicked without custom onComment", () => {
    renderWithProviders(<PostCard post={mockPost} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View comments" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens options dialog when more options button is clicked", () => {
    renderWithProviders(<PostCard post={mockPost} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link to post" })).toBeInTheDocument();
  });

  it("opens Likes from the counter without liking and closes the dialog", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({
      success: true, data: { users: [{ id: "u-alex", name: "Alex", username: "alex" }] },
    });
    const onLike = vi.fn();
    renderWithProviders(<PostCard post={mockPost} onLike={onLike} />);
    expect(apiSpy).not.toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/post-1/likes" }));
    expect(screen.getByRole("button", { name: "View likes" })).toHaveTextContent("42");

    fireEvent.click(screen.getByRole("button", { name: "View likes" }));

    expect(screen.getByRole("dialog", { name: "Likes" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "View Alex's profile" })).toHaveAttribute("href", "/profile/alex");
    expect(onLike).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog", { name: "Likes" })).not.toBeInTheDocument();
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
    expect(screen.getByText(longCaption)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.queryByText(longCaption)).not.toBeInTheDocument();
  });

  it("renders fallback box when image fails to load", () => {
    renderWithProviders(<PostCard post={mockPost} />);
    fireEvent.error(screen.getByRole("img", { name: /Post image:/i }));
    expect(screen.getByRole("img", { name: "Image failed to load" })).toBeInTheDocument();
  });
});

describe("PostCardSkeleton component", () => {
  it("renders loading status and aria-busy placeholder", () => {
    renderWithProviders(<PostCardSkeleton />);
    expect(screen.getByRole("status", { name: "Loading post" })).toHaveAttribute("aria-busy", "true");
  });
});
