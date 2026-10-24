import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import type { Post } from "@/features/posts/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import type { Comment } from "../types";
import { PostCommentsDialog } from "./post-comments-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/feed",
}));

const mockPost: Post = {
  id: "p-100", caption: "Sunset at the beach", imageUrl: "https://example.com/sunset.jpg",
  createdAt: "2026-10-24T12:00:00.000Z",
  author: { id: "u-1", name: "Davis Explorer", username: "davis", avatarUrl: "https://example.com/davis.jpg" },
  likesCount: 10, commentsCount: 2, isLiked: false, isSaved: false,
};

const mockComments: readonly Comment[] = [
  { id: "c-1", content: "Awesome shot!", createdAt: "2026-10-24T12:05:00.000Z", author: { id: "u-2", name: "Alice", username: "alice" } },
  { id: "c-2", content: "Where is this location?", createdAt: "2026-10-24T12:10:00.000Z", author: { id: "u-3", name: "Bob", username: "bob" } },
];

function renderWithProviders(ui: ReactNode, store?: AppStore) {
  const s = store ?? makeStore();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<Provider store={s}><QueryClientProvider client={qc}>{ui}</QueryClientProvider></Provider>);
}

describe("PostCommentsDialog", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders post image, author info, and caption in desktop modal", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(mockComments);
    renderWithProviders(<PostCommentsDialog post={mockPost} isOpen={true} onClose={vi.fn()} defaultView="modal" />);

    expect(screen.getByText("Davis Explorer")).toBeInTheDocument();
    expect(screen.getByText("Sunset at the beach")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Post image:/i })).toHaveAttribute("src", mockPost.imageUrl);
  });

  it("renders loading skeletons while comments are loading", () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockReturnValue(new Promise(() => {}));
    renderWithProviders(<PostCommentsDialog post={mockPost} isOpen={true} onClose={vi.fn()} defaultView="modal" />);

    expect(screen.getByLabelText("Loading comments")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Loading comment").length).toBe(3);
  });

  it("renders empty state when comments list is empty", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue([]);
    renderWithProviders(<PostCommentsDialog post={mockPost} isOpen={true} onClose={vi.fn()} defaultView="modal" />);

    await waitFor(() => {
      expect(screen.getByText("No comments yet")).toBeInTheDocument();
    });
    expect(screen.getByText("Be the first to share your thoughts!")).toBeInTheDocument();
  });

  it("renders loaded comments list when comments exist", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(mockComments);
    renderWithProviders(<PostCommentsDialog post={mockPost} isOpen={true} onClose={vi.fn()} defaultView="modal" />);

    await waitFor(() => {
      expect(screen.getByText("Awesome shot!")).toBeInTheDocument();
      expect(screen.getByText("Where is this location?")).toBeInTheDocument();
    });
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("submits comment form, calls mutation endpoint, and adds comment", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async (opts) => {
      if (opts.method === "POST") {
        return { id: "c-new", content: "Great vibes!", createdAt: new Date().toISOString(), author: { id: "u-me", name: "Me", username: "me" } };
      }
      return mockComments;
    });

    const store = makeStore();
    store.dispatch(setSession({ token: "auth-tok", sessionId: "sess-1", user: { id: "u-me", username: "me", name: "Me" } }));

    renderWithProviders(<PostCommentsDialog post={mockPost} isOpen={true} onClose={vi.fn()} defaultView="modal" />, store);

    await waitFor(() => expect(screen.getByText("Awesome shot!")).toBeInTheDocument());

    const input = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(input, { target: { value: "Great vibes!" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: "/api/posts/p-100/comments",
        method: "POST",
        body: { content: "Great vibes!" },
      }));
    });
  });

  it("closes modal on close button click and Escape key press", () => {
    const onClose = vi.fn();
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue([]);
    renderWithProviders(<PostCommentsDialog post={mockPost} isOpen={true} onClose={onClose} defaultView="modal" />);

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders mobile sheet layout with Comments title and drag handle when defaultView is sheet", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(mockComments);
    renderWithProviders(<PostCommentsDialog post={mockPost} isOpen={true} onClose={vi.fn()} defaultView="sheet" />);

    expect(screen.getByRole("heading", { name: "Comments" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close bottom sheet" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Awesome shot!")).toBeInTheDocument());
  });

  it("renders error state when comments fetch fails and supports retry", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch")
      .mockRejectedValueOnce(new Error("Network disconnect"))
      .mockResolvedValueOnce(mockComments);

    renderWithProviders(<PostCommentsDialog post={mockPost} isOpen={true} onClose={vi.fn()} defaultView="modal" />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("Failed to load comments")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(apiSpy).toHaveBeenCalledTimes(2));
  });
});
