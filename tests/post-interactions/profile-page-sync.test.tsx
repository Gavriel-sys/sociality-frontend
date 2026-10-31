import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MeProfilePage from "@/app/(private)/me/page";
import { loadSession } from "@/features/auth/session-storage";
import type { Post } from "@/features/posts/types";
import { createInteractionTestContext, jsonResponse, post } from "./test-support";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/me",
  useSearchParams: () => new URLSearchParams(),
}));

const initialProfile = { ...post.author, bio: "Original bio", email: "alex@example.com" };
const stats = { posts: 0, followers: 100, following: 43, likes: 567 };
const profileResponse = (bio = initialProfile.bio) => ({ success: true, data: { profile: { ...initialProfile, bio }, stats } });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
  const BrowserUrl = URL;
  vi.stubGlobal("URL", class extends BrowserUrl {
    static createObjectURL() { return "blob:preview"; }
    static revokeObjectURL() {}
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("profile page synchronization", () => {
  it("renders the nested backend profile and all four stats", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockImplementation(async (request) =>
      jsonResponse(new URL(String(request)).pathname === "/api/me" ? profileResponse() : { data: { posts: [] } }),
    ));
    const context = createInteractionTestContext();
    const view = render(<MeProfilePage />, context);

    expect(await screen.findByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByText("alex")).toBeInTheDocument();
    expect(screen.getByText("Original bio")).toBeInTheDocument();
    expect(screen.getByText("567")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "100 Followers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "43 Following" })).toBeInTheDocument();
    view.unmount();
    context.queryClient.clear();
  });

  it.each(["Updated bio", ""])("updates bio to '%s' and closes before the refetch finishes", async (updatedBio) => {
    let didUpdate = false;
    let finishRefetch: (response: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockImplementation(async (_request, options) => {
      if (options?.method === "PATCH") {
        expect(JSON.parse(String(options.body))).toMatchObject({ name: "Alex", bio: updatedBio });
        didUpdate = true;
        return jsonResponse(profileResponse(updatedBio));
      }
      if (didUpdate) return new Promise<Response>((resolve) => { finishRefetch = resolve; });
      return jsonResponse(profileResponse());
    }));
    const context = createInteractionTestContext();
    const view = render(<MeProfilePage />, context);
    await screen.findByRole("heading", { name: "Alex" });
    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
    expect(screen.getByLabelText("Full Name")).toHaveValue("Alex");
    expect(screen.getByLabelText("Bio")).toHaveValue("Original bio");

    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: updatedBio } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Edit profile" })).not.toBeInTheDocument());
    expect(screen.getByText(updatedBio || "No bio yet")).toBeInTheDocument();
    expect(context.store.getState().auth.user?.bio).toBe(updatedBio);
    expect(loadSession()?.user).toMatchObject({ bio: updatedBio, username: "alex", id: 1 });
    finishRefetch(jsonResponse(profileResponse(updatedBio)));
    await waitFor(() => expect(context.queryClient.isFetching()).toBe(0));
    view.unmount();
    context.queryClient.clear();
  });

  it.each(["Create post", "Upload My First Post"])("creates a post via %s and refreshes Gallery and the count", async (trigger) => {
    let posts: readonly Post[] = [];
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockImplementation(async (request, options) => {
      const pathname = new URL(String(request)).pathname;
      if (pathname === "/api/posts" && options?.method === "POST") {
        posts = [post];
        return jsonResponse({ success: true, data: post });
      }
      if (pathname === "/api/me") return jsonResponse({ ...initialProfile, postsCount: posts.length });
      return jsonResponse({ data: { posts } });
    }));
    const context = createInteractionTestContext();
    const invalidateQueries = vi.spyOn(context.queryClient, "invalidateQueries");
    const view = render(<MeProfilePage />, context);
    await screen.findByRole("heading", { name: "Alex" });
    expect(screen.getByRole("tab", { name: "Gallery" })).toHaveAttribute("aria-selected", "true");
    await screen.findByRole("heading", { name: "Your story starts here" });

    fireEvent.click(screen.getByRole("button", { name: trigger }));
    expect(screen.getByRole("dialog", { name: "Add Post" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Upload image"), {
      target: { files: [new File(["photo"], "photo.png", { type: "image/png" })] },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), { target: { value: "Backend post" } });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(await screen.findByRole("link", { name: "View post: Backend post" })).toHaveAttribute("href", "/posts/42");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add Post" })).not.toBeInTheDocument());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["private", "session-alex", "posts"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["private", "session-alex", "me"] });
    expect(context.queryClient.getQueryData(["private", "session-alex", "me"]))
      .toMatchObject({ postsCount: 1 });
    view.unmount();
    context.queryClient.clear();
  });
});
