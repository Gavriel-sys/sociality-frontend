import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { AppProviders } from "@/providers/app-providers";
import { normalizePost } from "../types";
import type { Post } from "../types";
import { CreatePostDialog } from "./create-post-dialog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/features/auth/session-storage", () => ({
  loadSession: () => ({ token: "test-token", sessionId: "test-session", user: { username: "alex" } }),
}));

let queryClient: QueryClient;
beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
  globalThis.URL.revokeObjectURL = vi.fn();
});
afterEach(() => { queryClient.clear(); vi.restoreAllMocks(); });

function ComposerHarness() {
  const [isComposerOpen, setIsComposerOpen] = useState(true);
  return isComposerOpen
    ? <CreatePostDialog isOpen onClose={() => setIsComposerOpen(false)} />
    : <p>Feed</p>;
}

function renderComposer() {
  render(<AppProviders queryClient={queryClient}><ComposerHarness /></AppProviders>);
}

function submitPost() {
  fireEvent.change(screen.getByLabelText("Upload image"), {
    target: { files: [new File(["photo"], "photo.png", { type: "image/png" })] },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), { target: { value: "My photo" } });
  fireEvent.click(screen.getByRole("button", { name: "Share" }));
}

describe("post success notification integration", () => {
  it("appears only after a successful upload and survives composer unmounting", async () => {
    let resolveUpload: (post: Post) => void = () => {};
    const pendingUpload = new Promise<Post>((resolve) => { resolveUpload = resolve; });
    vi.spyOn(apiFetchModule, "apiFetch").mockReturnValueOnce(pendingUpload);
    renderComposer();

    submitPost();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await act(async () => { resolveUpload(normalizePost({ id: "new-post", imageUrl: "/photo.png" })); });

    expect(await screen.findByRole("status")).toHaveTextContent("Success Post");
    expect(screen.queryByRole("dialog", { name: "Add Post" })).not.toBeInTheDocument();
    expect(screen.getByText("Feed")).toBeInTheDocument();
  });

  it("does not show success when the upload fails", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Upload failed"));
    renderComposer();

    submitPost();

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload failed");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not show success for invalid submission or cancellation", () => {
    const upload = vi.spyOn(apiFetchModule, "apiFetch");
    renderComposer();

    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });
});
