import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore } from "@/lib/store/store";
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

function renderWithStore(ui: ReactNode, authUser?: { id: string; username: string } | null) {
  const store = makeStore();
  if (authUser) {
    store.dispatch(setSession({ token: "tok-1", sessionId: "sess-1", user: authUser }));
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </Provider>,
  );
}

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
  });

  it("falls back to author name when username is empty", () => {
    const commentWithoutUsername: Comment = {
      ...mockComment,
      author: { id: "user-44", name: "Anonymous", username: "" },
    };
    render(<CommentRow comment={commentWithoutUsername} />);
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("shows delete button when authenticated user is comment author (case-insensitive)", () => {
    renderWithStore(<CommentRow comment={mockComment} />, { id: "user-42", username: "JaneDoe" });
    expect(screen.getByRole("button", { name: "Delete comment" })).toBeInTheDocument();
  });

  it("hides delete button when user is not comment author or guest", () => {
    const { unmount } = renderWithStore(<CommentRow comment={mockComment} />, null);
    expect(screen.queryByRole("button", { name: "Delete comment" })).not.toBeInTheDocument();
    unmount();

    renderWithStore(<CommentRow comment={mockComment} />, { id: "user-99", username: "otheruser" });
    expect(screen.queryByRole("button", { name: "Delete comment" })).not.toBeInTheDocument();
  });

  it("shows confirmation prompt when delete clicked and cancels on Cancel", () => {
    renderWithStore(<CommentRow comment={mockComment} />, { id: "user-42", username: "janedoe" });
    fireEvent.click(screen.getByRole("button", { name: "Delete comment" }));

    expect(screen.getByText("Delete?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete comment" })).toBeInTheDocument();
  });

  it("calls onDelete callback when confirmed", async () => {
    const onDelete = vi.fn();
    renderWithStore(<CommentRow comment={mockComment} onDelete={onDelete} />, { id: "user-42", username: "janedoe" });

    fireEvent.click(screen.getByRole("button", { name: "Delete comment" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it("calls deleteComment mutation when confirmed without onDelete", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce({ success: true });
    renderWithStore(<CommentRow comment={mockComment} postId="101" />, { id: "user-42", username: "janedoe" });

    fireEvent.click(screen.getByRole("button", { name: "Delete comment" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: "/api/comments/comm-1",
        method: "DELETE",
      }));
    });
  });
});
