import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import type { Post } from "@/features/posts/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { PostOptionsDialog } from "./post-options-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/feed",
}));

const mockPost: Post = {
  id: "p-42",
  caption: "Nice view",
  imageUrl: "https://example.com/p.jpg",
  createdAt: "2026-10-25T12:00:00Z",
  author: { id: "u-author", name: "Author", username: "author" },
  likesCount: 10,
  commentsCount: 2,
  isLiked: false,
  isSaved: false,
};

function renderWithProviders(ui: ReactNode, store?: AppStore) {
  const s = store ?? makeStore();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<Provider store={s}><QueryClientProvider client={qc}>{ui}</QueryClientProvider></Provider>);
}

describe("PostOptionsDialog component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Delete post when user is the post author", () => {
    const store = makeStore();
    store.dispatch(setSession({ token: "tok", sessionId: "sess", user: { username: "author" } }));
    renderWithProviders(<PostOptionsDialog post={mockPost} isOpen onClose={vi.fn()} />, store);

    expect(screen.getByRole("button", { name: "Delete post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link to post" })).toBeInTheDocument();
  });

  it("hides Delete post when user is not the author or is a guest", () => {
    const store = makeStore();
    store.dispatch(setSession({ token: "tok", sessionId: "sess", user: { username: "otheruser" } }));
    const { rerender } = renderWithProviders(<PostOptionsDialog post={mockPost} isOpen onClose={vi.fn()} />, store);
    expect(screen.queryByRole("button", { name: "Delete post" })).not.toBeInTheDocument();

    const guestStore = makeStore();
    rerender(<Provider store={guestStore}><QueryClientProvider client={new QueryClient()}><PostOptionsDialog post={mockPost} isOpen onClose={vi.fn()} /></QueryClientProvider></Provider>);
    expect(screen.queryByRole("button", { name: "Delete post" })).not.toBeInTheDocument();
  });

  it("shows inline confirmation before deletion and allows canceling back to menu", () => {
    const store = makeStore();
    store.dispatch(setSession({ token: "tok", sessionId: "sess", user: { username: "author" } }));
    renderWithProviders(<PostOptionsDialog post={mockPost} isOpen onClose={vi.fn()} />, store);

    fireEvent.click(screen.getByRole("button", { name: "Delete post" }));
    expect(screen.getByText("Are you sure you want to delete this post? This action cannot be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Delete post" })).toBeInTheDocument();
  });

  it("calls delete mutation and onDeleted callback on confirm", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ ok: true });
    const store = makeStore();
    store.dispatch(setSession({ token: "tok", sessionId: "sess", user: { username: "author" } }));
    const onClose = vi.fn();
    const onDeleted = vi.fn();

    renderWithProviders(<PostOptionsDialog post={mockPost} isOpen onClose={onClose} onDeleted={onDeleted} />, store);
    fireEvent.click(screen.getByRole("button", { name: "Delete post" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: "/api/posts/p-42",
        method: "DELETE",
        token: "tok",
      }));
      expect(onClose).toHaveBeenCalled();
      expect(onDeleted).toHaveBeenCalled();
    });
  });

  it("copies link to post to clipboard and shows feedback", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    renderWithProviders(<PostOptionsDialog post={mockPost} isOpen onClose={vi.fn()} />);
    const copyBtn = screen.getByRole("button", { name: "Copy link to post" });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("/posts/p-42");
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });
});
