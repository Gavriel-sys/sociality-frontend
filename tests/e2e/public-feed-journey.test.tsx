import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FeedPage from "@/app/(private)/feed/page";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { createFeedTestContext, createRawPost } from "@/features/feed/feed-test-utils";
import * as apiFetchModule from "@/lib/api/api-fetch";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/feed",
  useSearchParams: () => new URLSearchParams(),
}));

describe("E2E public feed journey", () => {
  let context: ReturnType<typeof createFeedTestContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    context = createFeedTestContext();
    context.store.dispatch(setSession({
      token: "new-user-token", sessionId: "new-user-session",
      user: { id: "new-user", username: "newcomer" },
    }));
  });

  afterEach(() => { context.queryClient.clear(); vi.restoreAllMocks(); });

  it("lets guests read and load more community posts without logging in", async () => {
    const renderError = vi.spyOn(console, "error");
    context.store.dispatch(clearSession());
    const firstPage = Array.from({ length: 10 }, (_unused, postIndex) =>
      createRawPost(`guest-post-${postIndex}`, `Community post ${postIndex}`),
    );
    const fetchApi = vi.spyOn(apiFetchModule, "apiFetch")
      .mockImplementation(async ({ endpoint }) => {
        if (!endpoint.startsWith("/api/posts?")) return [];
        const posts = endpoint.includes("page=2")
          ? [createRawPost("last-post", "More community news")] : firstPage;
        return { data: { posts } };
      });

    render(<FeedPage />, { wrapper: context.wrapper });
    expect(await screen.findByText("Community post 0")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Load more posts" }));

    expect(await screen.findByText("More community news")).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "/api/posts?page=1&limit=10", token: undefined,
    }));
    expect(fetchApi).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "/api/posts?page=2&limit=10", token: undefined,
    }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(renderError).not.toHaveBeenCalled();
  });

  it("shows another creator's public post before the new user follows anyone", async () => {
    const fetchApi = vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async ({ endpoint }) =>
      endpoint.startsWith("/api/posts?")
        ? { data: { posts: [createRawPost("community-post", "Welcome to the community")] } }
        : [],
    );

    render(<FeedPage />, { wrapper: context.wrapper });

    expect(await screen.findByText("Welcome to the community")).toBeInTheDocument();
    expect(screen.getByText("User One")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlike post" })).toBeInTheDocument();
    expect(fetchApi).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "/api/posts?page=1&limit=10", token: "new-user-token",
    }));
    expect(screen.queryByText("No posts in your feed yet")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).not.toHaveTextContent("Explore");
  });

  it("takes the new user to search when no public posts exist", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ data: { posts: [] } });

    render(<FeedPage />, { wrapper: context.wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Find creators" }));

    expect(mockPush).toHaveBeenCalledExactlyOnceWith("/users/search");
  });
});
