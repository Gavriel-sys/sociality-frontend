import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import * as exploreHookModule from "@/features/explore/use-infinite-explore";
import type { Post } from "@/features/posts/types";
import { makeStore, type AppStore } from "@/lib/store/store";
import ExplorePage from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/explore",
  useSearchParams: () => new URLSearchParams(),
}));

const mockPost1: Post = {
  id: "exp-1",
  caption: "First explore discovery",
  imageUrl: "https://example.com/exp1.jpg",
  createdAt: "2026-10-23T08:00:00.000Z",
  author: { id: "u-10", name: "Alice Explorer", username: "alice_exp" },
  likesCount: 15,
  commentsCount: 4,
  isLiked: false,
  isSaved: false,
};

const mockPost2: Post = {
  id: "exp-2",
  caption: "Second creative work",
  imageUrl: "https://example.com/exp2.jpg",
  createdAt: "2026-10-23T09:00:00.000Z",
  author: { id: "u-11", name: "Bob Explorer", username: "bob_exp" },
  likesCount: 30,
  commentsCount: 6,
  isLiked: true,
  isSaved: true,
};

describe("ExplorePage", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    store.dispatch(setSession({ token: "test-token", sessionId: "test-session", user: { username: "tester" } }));
  });

  function renderExplore(ui: ReactNode = <ExplorePage />) {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </Provider>,
    );
  }

  function mockExploreHook(overrides: Partial<exploreHookModule.UseInfiniteExploreResult> = {}) {
    vi.spyOn(exploreHookModule, "useInfiniteExplore").mockReturnValue({
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
    mockExploreHook({ isLoading: true });
    renderExplore();

    expect(screen.getByRole("status", { name: "Loading explore posts" })).toBeInTheDocument();
    expect(screen.getAllByRole("status", { name: "Loading post" })).toHaveLength(3);
  });

  it("renders error state with retry button on failure", () => {
    const mockRefetch = vi.fn();
    mockExploreHook({ isError: true, error: new Error("Server timeout"), refetch: mockRefetch });
    renderExplore();

    expect(screen.getByText("Failed to load explore posts")).toBeInTheDocument();
    expect(screen.getByText("Server timeout")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when explore has 0 posts", () => {
    mockExploreHook({ posts: [] });
    renderExplore();

    expect(screen.getByText("No explore posts available")).toBeInTheDocument();
    expect(screen.getByText("Check back later for new posts from the community.")).toBeInTheDocument();
  });

  it("renders list of PostCard items when posts exist", () => {
    mockExploreHook({ posts: [mockPost1, mockPost2], hasNextPage: false });
    renderExplore();

    expect(screen.getByRole("heading", { level: 1, name: "Explore" })).toBeInTheDocument();
    expect(screen.getByText("First explore discovery")).toBeInTheDocument();
    expect(screen.getByText("Second creative work")).toBeInTheDocument();
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });

  it("calls fetchNextPage when Load more posts button is clicked", () => {
    const mockFetchNextPage = vi.fn().mockResolvedValue(undefined);
    mockExploreHook({ posts: [mockPost1], hasNextPage: true, fetchNextPage: mockFetchNextPage });
    renderExplore();

    const loadMoreBtn = screen.getByRole("button", { name: "Load more posts" });
    fireEvent.click(loadMoreBtn);
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });
});
