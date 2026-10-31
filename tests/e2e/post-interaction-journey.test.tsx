import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FeedPage from "@/app/(private)/feed/page";
import { setSession } from "@/features/auth/auth-slice";
import type { Comment } from "@/features/comments/types";
import type { Post } from "@/features/posts/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/feed",
  useSearchParams: () => new URLSearchParams(),
}));

const mockUser = { id: "u-author-1", username: "alex101", name: "Alex Vance" };
const mockPost: Post = {
  id: "post-101", caption: "Cyberpunk cityscape neon night", imageUrl: "https://example.com/city.jpg",
  createdAt: "2026-10-26T12:00:00Z", author: mockUser, likesCount: 5, commentsCount: 1,
  isLiked: false, isSaved: false,
};
const mockComment: Comment = {
  id: "comm-1", content: "Awesome photo!", createdAt: "2026-10-26T12:05:00Z", author: mockUser,
};

function createWrapper(store: AppStore, queryClient: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

describe("E2E Post Interaction Journey", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    store.dispatch(setSession({ token: "jwt-token-alex", sessionId: "sess-alex-1", user: mockUser }));
  });

  it("completes feed render -> like -> save -> comment -> delete comment -> delete post flow", async () => {
    let feedPosts: Post[] = [mockPost];
    let commentsList: Comment[] = [mockComment];
    let savedPosts: Post[] = [];

    const fetchApi = vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async ({ endpoint, method, body }) => {
      if (endpoint === "/api/posts/post-101" && method === "DELETE") {
        feedPosts = [];
        return { success: true };
      }
      if (endpoint.startsWith("/api/posts?")) return { data: { posts: feedPosts } };
      if (endpoint.startsWith("/api/me/saved")) return { data: { posts: savedPosts } };
      if (endpoint.endsWith("/save")) {
        savedPosts = method === "POST" ? [{ ...mockPost, isSaved: true }] : [];
        return { success: true };
      }
      if (endpoint.endsWith("/like")) {
        feedPosts = feedPosts.map((post) => ({ ...post, isLiked: true, likesCount: post.likesCount + 1 }));
        return { success: true };
      }
      if (endpoint.includes("/comments") && method === "POST") {
        const nextComment: Comment = {
          id: "comm-2", content: (body as { text: string }).text,
          createdAt: new Date().toISOString(), author: mockUser,
        };
        commentsList = [...commentsList, nextComment];
        return nextComment;
      }
      if (endpoint.includes("/api/comments/") && method === "DELETE") {
        commentsList = commentsList.filter((comment) => comment.id !== "comm-1");
        return { success: true };
      }
      if (endpoint.includes("/comments")) return commentsList;
      return {};
    });

    const Wrapper = createWrapper(store, queryClient);
    render(createElement(Wrapper, null, createElement(FeedPage)));

    expect(await screen.findByText("Cyberpunk cityscape neon night")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "/api/posts?page=1&limit=10", token: "jwt-token-alex",
    }));

    fireEvent.click(screen.getByRole("button", { name: "Like post" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Unlike post" })).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save post" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Remove from saved" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "View comments" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(await screen.findByText("Awesome photo!")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Add a comment..."), { target: { value: "Great vibes here!" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    await waitFor(() => {
      expect(screen.getByText("Great vibes here!")).toBeInTheDocument();
    });

    const originalComment = screen.getAllByRole("article", { name: "Comment by alex101" }).find((comment) => within(comment).queryByText("Awesome photo!"));
    if (!originalComment) throw new Error("Original comment missing");
    fireEvent.click(within(originalComment).getByRole("button", { name: "Delete comment" }));
    const confirmDeleteBtn = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmDeleteBtn);
    await waitFor(() => {
      expect(screen.queryByText("Awesome photo!")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Close dialog"));
    await waitFor(() => { expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); });

    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete post" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete post" }));
    expect(screen.getByText(/Are you sure you want to delete this post/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText("Cyberpunk cityscape neon night")).not.toBeInTheDocument();
      expect(screen.getByText("No posts in your feed yet")).toBeInTheDocument();
    });
  }, 15000);
});
