import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MeProfilePage from "@/app/(private)/me/page";
import { createInteractionTestContext, jsonResponse, post } from "./test-support";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/me",
  useSearchParams: () => new URLSearchParams(),
}));
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

const profile = { ...post.author, postsCount: 1, followersCount: 0, followingCount: 0 };
const collectionCases = [
  { tab: "Gallery", collection: "posts", emptyTitle: "Your story starts here" },
  { tab: "Saved", collection: "saved", emptyTitle: "No saved posts yet" },
];

describe("live profile collections", () => {
  it.each(collectionCases)("connects $tab to its authenticated endpoint", async ({ tab, collection }) => {
    const fetchRequest = vi.fn<typeof fetch>().mockImplementation(async (request) => {
      const pathname = new URL(String(request)).pathname;
      if (pathname === "/api/me") return jsonResponse(profile);
      return jsonResponse({ success: true, data: pathname === "/api/me/posts" ? { items: [post] } : { posts: [post] } });
    });
    vi.stubGlobal("fetch", fetchRequest);
    const { queryClient, wrapper } = createInteractionTestContext();
    queryClient.setQueryData(["private", "session-alex", "feed", {}], { pages: [[post]], pageParams: [1] });
    render(<MeProfilePage />, { wrapper });
    await screen.findByRole("heading", { name: "Alex" });

    fireEvent.click(screen.getByRole("tab", { name: tab }));

    const tile = await screen.findByRole("link", { name: "View post: Backend post" });
    expect(tile).toHaveAttribute("href", "/posts/42");
    expect(within(tile).getByRole("img", { name: "Post image: Backend post" })).toHaveAttribute("src", post.imageUrl);
    const requestedCollection = fetchRequest.mock.calls.find(([request]) => String(request).includes(`/api/me/${collection}?`));
    expect(requestedCollection).toBeDefined();
    expect(new Headers(requestedCollection?.[1]?.headers).get("Authorization")).toBe("Bearer test-jwt");
  });

  it.each(collectionCases)("shows the $tab empty state after loading", async ({ tab, emptyTitle }) => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockImplementation(async (request) =>
      jsonResponse(new URL(String(request)).pathname === "/api/me" ? profile : { data: { posts: [] } }),
    ));
    const { wrapper } = createInteractionTestContext();
    render(<MeProfilePage />, { wrapper });
    await screen.findByRole("heading", { name: "Alex" });

    fireEvent.click(screen.getByRole("tab", { name: tab }));

    expect(await screen.findByText(emptyTitle)).toBeInTheDocument();
  });

  it("shows collection loading, error and retry states", async () => {
    let finishRequest: (response: Response) => void = () => {};
    let savedRequests = 0;
    const fetchRequest = vi.fn<typeof fetch>().mockImplementation(async (request) => {
      const pathname = new URL(String(request)).pathname;
      if (pathname === "/api/me") return jsonResponse(profile);
      if (pathname === "/api/me/saved" && savedRequests++ === 0) {
        return new Promise<Response>((resolve) => { finishRequest = resolve; });
      }
      return jsonResponse({ data: { posts: [] } });
    });
    vi.stubGlobal("fetch", fetchRequest);
    const { wrapper } = createInteractionTestContext();
    render(<MeProfilePage />, { wrapper });
    await screen.findByRole("heading", { name: "Alex" });

    fireEvent.click(screen.getByRole("tab", { name: "Saved" }));
    expect(screen.getByRole("status", { name: "Loading posts" })).toBeInTheDocument();
    finishRequest(new Response("Unavailable", { status: 503 }));
    expect(await screen.findByText("Failed to load posts")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("No saved posts yet")).toBeInTheDocument();
  });
});
