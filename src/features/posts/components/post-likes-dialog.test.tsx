import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore } from "@/lib/store/store";
import { PostLikesDialog } from "./post-likes-dialog";
import type { PostLikesDialogProps } from "./post-likes-dialog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/feed" }));
afterEach(() => vi.restoreAllMocks());

const likedUser = { id: "john", name: "John Doe", username: "johndoe", avatarUrl: "/john.jpg", isFollowing: false };

function renderLikes(options: Partial<PostLikesDialogProps> = {}, store = makeStore()) {
  const props = { isOpen: true, onClose: vi.fn(), users: [likedUser], isLoading: false, isError: false, onRetry: vi.fn(), ...options };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<Provider store={store}><QueryClientProvider client={queryClient}><PostLikesDialog {...props} /></QueryClientProvider></Provider>);
  return props;
}

function createAuthenticatedStore() {
  const store = makeStore();
  store.dispatch(setSession({ token: "likes-token", sessionId: "likes-session", user: { username: "alex" } }));
  return store;
}

describe("PostLikesDialog", () => {
  it("shows Likes, user avatars and names, and both follow states", () => {
    renderLikes({ users: [likedUser, { ...likedUser, id: "sam", name: "Sam", username: "sam", isFollowing: true }] });

    expect(screen.getByRole("dialog", { name: "Likes" })).toBeInTheDocument();
    expect(screen.getByText("johndoe")).toBeInTheDocument();
    expect(screen.queryByText("@johndoe")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "John Doe's avatar" })).toHaveAttribute("src", "/john.jpg");
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Following" }).querySelector("svg")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("does not mount users or request relationship data while closed", () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    renderLikes({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("shows loading placeholders before users arrive", () => {
    renderLikes({ isLoading: true, users: [] });
    expect(screen.getByLabelText("Loading likes")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("button", { name: "Follow" })).not.toBeInTheDocument();
  });

  it("keeps the empty message", () => {
    renderLikes({ users: [] });
    expect(screen.getByText("No likes on this post yet")).toBeInTheDocument();
  });

  it("allows retrying a failed likes request", () => {
    const props = renderLikes({ isError: true });
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(["button", "escape", "backdrop"])("closes with %s", (action) => {
    const props = renderLikes();
    if (action === "button") fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    if (action === "escape") fireEvent.keyDown(window, { key: "Escape" });
    if (action === "backdrop") fireEvent.click(screen.getByRole("presentation"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on profile navigation", () => {
    const props = renderLikes();
    const profileLink = screen.getByRole("link", { name: "View John Doe's profile" });
    expect(profileLink).toHaveAttribute("href", "/profile/johndoe");
    profileLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(profileLink);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("reads Following from the current user's nested network response", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ success: true, data: { users: [likedUser] } });
    renderLikes({ users: [{ ...likedUser, isFollowing: undefined }] }, createAuthenticatedStore());

    expect(await screen.findByRole("button", { name: "Following" })).toBeInTheDocument();
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/users/alex/following", token: "likes-token" }));
  });

  it("follows once while pending and keeps the dialog open", async () => {
    const request = Promise.withResolvers<unknown>();
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockReturnValue(request.promise);
    const props = renderLikes({}, createAuthenticatedStore());
    const followButton = screen.getByRole("button", { name: "Follow" });

    fireEvent.click(followButton);
    fireEvent.click(followButton);
    await waitFor(() => expect(apiSpy).toHaveBeenCalledTimes(1));
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/api/follow/johndoe", method: "POST" }));
    await act(async () => { request.resolve({ success: true }); });

    expect(await screen.findByRole("button", { name: "Following" })).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("does not offer following your own account", () => {
    renderLikes({ users: [{ ...likedUser, username: "alex" }] }, createAuthenticatedStore());
    expect(screen.queryByRole("button", { name: "Follow" })).not.toBeInTheDocument();
  });
});
