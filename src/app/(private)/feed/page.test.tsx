import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import * as feedHookModule from "@/features/feed/use-infinite-feed";
import type { Post } from "@/features/posts/types";
import { makeStore, type AppStore } from "@/lib/store/store";
import FeedPage from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/feed",
  useSearchParams: () => new URLSearchParams(),
}));

const mockPost1: Post = {
  id: "p-1",
  caption: "First awesome post",
  imageUrl: "https://example.com/p1.jpg",
  createdAt: "2026-10-22T08:00:00.000Z",
  author: { id: "u-1", name: "Alice", username: "alice" },
  likesCount: 10,
  commentsCount: 2,
  isLiked: false,
  isSaved: false,
};

const mockPost2: Post = {
  id: "p-2",
  caption: "Second inspiring update",
  imageUrl: "https://example.com/p2.jpg",
  createdAt: "2026-10-22T09:00:00.000Z",
  author: { id: "u-2", name: "Bob", username: "bob" },
  likesCount: 25,
  commentsCount: 5,
  isLiked: true,
  isSaved: true,
};

describe("FeedPage", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    store.dispatch(setSession({ token: "test-token", sessionId: "test-session", user: { username: "tester" } }));
  });

  function renderFeed(ui: ReactNode = <FeedPage />) {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </Provider>,
    );
  }

  function mockFeedHook(overrides: Partial<feedHookModule.UseInfiniteFeedResult> = {}) {
    vi.spyOn(feedHookModule, "useInfiniteFeed").mockReturnValue({
      posts: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
      ...overrides,
    });
  }

  it("renders loading skeletons while loading", () => {
    mockFeedHook({ isLoading: true });
    renderFeed();

    expect(screen.getByRole("status", { name: "Loading feed" })).toBeInTheDocument();
    expect(screen.getAllByRole("status", { name: "Loading post" })).toHaveLength(3);
  });

  it("renders error state with retry button on failure", () => {
    const mockRefetch = vi.fn();
    mockFeedHook({ isError: true, error: new Error("Network timeout"), refetch: mockRefetch });
    renderFeed();

    expect(screen.getByText("Failed to load feed")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when feed has 0 posts", () => {
    mockFeedHook({ posts: [] });
    renderFeed();

    expect(screen.getByText("No posts in your feed yet")).toBeInTheDocument();
    expect(screen.getByText("Follow other creators to see their posts here.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Explore creators" }));
    expect(mockPush).toHaveBeenCalledWith("/explore");
  });

  it("renders list of PostCard items when posts exist", () => {
    mockFeedHook({ posts: [mockPost1, mockPost2], hasNextPage: false });
    renderFeed();

    expect(screen.getByText("First awesome post")).toBeInTheDocument();
    expect(screen.getByText("Second inspiring update")).toBeInTheDocument();
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });

  it("calls fetchNextPage when Load more posts button is clicked", () => {
    const mockFetchNextPage = vi.fn().mockResolvedValue(undefined);
    mockFeedHook({ posts: [mockPost1], hasNextPage: true, fetchNextPage: mockFetchNextPage });
    renderFeed();

    const loadMoreBtn = screen.getByRole("button", { name: "Load more posts" });
    fireEvent.click(loadMoreBtn);
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });
});
