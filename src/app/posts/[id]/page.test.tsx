import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import PostDetailPage from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/posts/p-100",
}));

const mockPost = {
  id: "p-100",
  caption: "Epic starry night in Utah desert",
  imageUrl: "https://example.com/stars.jpg",
  createdAt: "2026-10-24T12:00:00.000Z",
  author: { id: "u-star", name: "Star Gazer", username: "stargazer", avatarUrl: "https://example.com/star-avatar.jpg" },
  likesCount: 99,
  commentsCount: 0,
  isLiked: false,
  isSaved: false,
};

function renderWithProviders(ui: ReactNode, store?: AppStore) {
  const s = store ?? makeStore();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<Provider store={s}><QueryClientProvider client={qc}>{ui}</QueryClientProvider></Provider>);
}

describe("PostDetailPage route (/posts/[id])", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders loading skeleton while post detail is being fetched", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockReturnValue(new Promise(() => {}));
    await act(async () => {
      renderWithProviders(<PostDetailPage params={Promise.resolve({ id: "p-100" })} />);
    });

    expect(screen.getByRole("status", { name: "Loading post" })).toBeInTheDocument();
  });

  it("renders 404 error state and navigates to /feed when post not found", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValue(new Error("Post not found"));
    await act(async () => {
      renderWithProviders(<PostDetailPage params={Promise.resolve({ id: "p-nonexistent" })} />);
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Post not found" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Back to feed" }));
    expect(mockPush).toHaveBeenCalledWith("/feed");
  });

  it("renders loaded PostDetailView with author, caption, and media when post exists", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async (opts) => {
      if (opts.endpoint?.includes("/comments")) return [];
      return mockPost;
    });

    await act(async () => {
      renderWithProviders(<PostDetailPage params={Promise.resolve({ id: "p-100" })} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Epic starry night in Utah desert")).toBeInTheDocument();
      expect(screen.getAllByText("Star Gazer").length).toBeGreaterThan(0);
      expect(screen.getByRole("img", { name: /Post image:/i })).toHaveAttribute("src", mockPost.imageUrl);
      expect(screen.getByText("99")).toBeInTheDocument();
    });
  });

  it("supports synchronous params object as well as promise params", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async (opts) => {
      if (opts.endpoint?.includes("/comments")) return [];
      return mockPost;
    });

    renderWithProviders(<PostDetailPage params={{ id: "p-100" }} />);

    await waitFor(() => {
      expect(screen.getByText("Epic starry night in Utah desert")).toBeInTheDocument();
    });
  });
});
