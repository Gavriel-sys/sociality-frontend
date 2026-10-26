import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import type { Post } from "@/features/posts/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { PostDetailView } from "./post-detail-view";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/posts/p-10",
}));

const mockPost: Post = {
  id: "p-10",
  caption: "Sunset over Mount Rainier!",
  imageUrl: "https://example.com/rainier.jpg",
  createdAt: "2026-10-24T12:00:00.000Z",
  author: { id: "u-10", name: "Rainier Explorer", username: "rainier", avatarUrl: "https://example.com/rainier-user.jpg" },
  likesCount: 50,
  commentsCount: 2,
  isLiked: false,
  isSaved: false,
};

const mockComments = [
  { id: "c-1", content: "Majestic view!", createdAt: "2026-10-24T12:10:00.000Z", author: { id: "u-1", name: "Sam", username: "sam" } },
  { id: "c-2", content: "Great composition!", createdAt: "2026-10-24T12:20:00.000Z", author: { id: "u-2", name: "Alex", username: "alex" } },
];

function renderWithProviders(ui: ReactNode, store?: AppStore) {
  const s = store ?? makeStore();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<Provider store={s}><QueryClientProvider client={qc}>{ui}</QueryClientProvider></Provider>);
}

describe("PostDetailView component", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders author, relative date, media, caption, and counters", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(mockComments);
    renderWithProviders(<PostDetailView post={mockPost} />);

    expect(screen.getAllByText("Rainier Explorer").length).toBeGreaterThan(0);
    expect(screen.getByText("Sunset over Mount Rainier!")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Post image:/i })).toHaveAttribute("src", mockPost.imageUrl);
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders comments loading skeletons and then loaded comments list", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(mockComments);
    renderWithProviders(<PostDetailView post={mockPost} />);

    await waitFor(() => {
      expect(screen.getByText("Majestic view!")).toBeInTheDocument();
      expect(screen.getByText("Great composition!")).toBeInTheDocument();
    });
  });

  it("renders empty state when there are no comments", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue([]);
    renderWithProviders(<PostDetailView post={mockPost} />);

    await waitFor(() => {
      expect(screen.getByText("No comments yet")).toBeInTheDocument();
    });
  });

  it("triggers like mutation when like button is clicked", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async (opts) => {
      if (opts.endpoint?.includes("/like")) return { ok: true };
      return mockComments;
    });
    const store = makeStore();
    store.dispatch(setSession({ token: "card-tok", sessionId: "card-sess", user: { username: "carduser" } }));

    renderWithProviders(<PostDetailView post={mockPost} />, store);
    fireEvent.click(screen.getByRole("button", { name: "Like post" }));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/p-10/like", method: "POST" }));
    });
  });

  it("opens options dialog on 3-dots click and redirects to /feed on delete", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async (opts) => {
      if (opts.method === "DELETE") return { ok: true };
      return mockComments;
    });
    const store = makeStore();
    store.dispatch(setSession({ token: "card-tok", sessionId: "card-sess", user: { username: "rainier" } }));

    renderWithProviders(<PostDetailView post={mockPost} />, store);
    const moreBtn = screen.getAllByRole("button", { name: "More options" })[0];
    fireEvent.click(moreBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete post" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/p-10", method: "DELETE" }));
      expect(mockPush).toHaveBeenCalledWith("/feed");
    });
  });

  it("submits comment form and calls addComment API", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async (opts) => {
      if (opts.method === "POST") return { id: "c-new", content: "Superb!", createdAt: new Date().toISOString(), author: { id: "u-me", name: "Me", username: "me" } };
      return mockComments;
    });
    const store = makeStore();
    store.dispatch(setSession({ token: "card-tok", sessionId: "card-sess", user: { id: "u-me", username: "me" } }));

    renderWithProviders(<PostDetailView post={mockPost} />, store);
    await waitFor(() => expect(screen.getByText("Majestic view!")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Add a comment..."), { target: { value: "Superb!" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/p-10/comments", method: "POST" }));
    });
  });
});
