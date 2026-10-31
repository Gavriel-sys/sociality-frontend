import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/api/api-fetch";
import { layoutComment, layoutPost, renderCommentLayout } from "./comment-layout-test-utils";
import { PostCommentsModal } from "./post-comments-modal";
import { PostCommentsSheet } from "./post-comments-sheet";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/feed",
}));

describe.each([["desktop", PostCommentsModal], ["mobile", PostCommentsSheet]] as const)("%s comment layout", (_view, CommentsView) => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "apiFetch").mockResolvedValue([]);
  });

  function renderView(comments = [layoutComment], onClose = vi.fn()) {
    return renderCommentLayout(<CommentsView post={layoutPost} isOpen onClose={onClose} comments={comments} isLoading={false} isError={false} onSubmitComment={vi.fn()} />);
  }

  it("names the comments view and stacks the comment timestamp below its username", () => {
    renderView();
    expect(screen.getByRole("dialog", { name: "Comments" })).toBeInTheDocument();
    const row = screen.getByRole("article", { name: "Comment by alexander" });
    const username = within(row).getByRole("link", { name: "alexander" });
    expect(username.parentElement).toHaveClass("flex-col");
    expect(username.nextElementSibling).toHaveAttribute("datetime", layoutComment.createdAt);
    expect(row).not.toHaveTextContent("·");
    expect(screen.getByRole("button", { name: "Add emoji" })).toBeInTheDocument();
  });

  it("shows only a muted, borderless message when there are no comments", () => {
    renderView([]);
    const emptyState = screen.getByRole("status");
    expect(emptyState).toHaveTextContent(/^No comments yet$/);
    expect(emptyState).toHaveClass("text-[#A4A7AE]");
    expect(emptyState.className).not.toMatch(/border|rounded/);
    expect(emptyState.querySelector("svg")).toBeNull();
  });

  it("keeps like and save mutations working with duplicate request guards", async () => {
    vi.mocked(api.apiFetch).mockReturnValue(new Promise(() => {}));
    renderView();
    const like = screen.getByRole("button", { name: "Like post" });
    fireEvent.click(like);
    fireEvent.click(like);
    await waitFor(() => expect(screen.getByRole("button", { name: "Unlike post" })).toHaveAttribute("aria-pressed", "true"));
    expect(api.apiFetch).toHaveBeenCalledTimes(1);
    const save = screen.getByRole("button", { name: "Save post" });
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove from saved" })).toHaveAttribute("aria-pressed", "true"));
    expect(api.apiFetch).toHaveBeenCalledTimes(2);
    expect(api.apiFetch).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/layout-post/like", method: "POST" }));
    expect(api.apiFetch).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/layout-post/save", method: "POST" }));
    expect(screen.getByLabelText("Comments count")).toHaveTextContent("1");
  });

  it("opens sharing options and closes only those options with Escape", () => {
    const onClose = vi.fn();
    renderView([layoutComment], onClose);
    fireEvent.click(screen.getByRole("button", { name: "Share post" }));
    expect(screen.getByRole("dialog", { name: "Post options" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Post options" })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("opens the post likes list from the count", async () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "View likes" }));
    expect(screen.getByRole("dialog", { name: "Likes" })).toBeInTheDocument();
    await waitFor(() => expect(api.apiFetch).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/posts/layout-post/likes" })));
  });
});

describe("Desktop post header", () => {
  it("joins author and caption, stacks its timestamp, and opens author options", () => {
    renderCommentLayout(<PostCommentsModal post={layoutPost} isOpen onClose={vi.fn()} comments={[]} isLoading={false} isError={false} onSubmitComment={vi.fn()} />);
    const author = screen.getByText("John Doe");
    expect(author.parentElement).toHaveClass("flex-col");
    expect(author.nextElementSibling).toHaveAttribute("datetime", layoutPost.createdAt);
    const header = author.closest("header");
    expect(header?.className).not.toMatch(/border/);
    expect(header?.nextElementSibling).toHaveTextContent(layoutPost.caption);
    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    expect(screen.getByRole("dialog", { name: "Post options" })).toBeInTheDocument();
  });
});
