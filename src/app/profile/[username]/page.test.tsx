import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import type { Post } from "@/features/posts/types";
import * as hooks from "@/features/profile/public-profile";
import type { PublicUserProfile } from "@/features/profile/types";
import { makeStore, type AppStore } from "@/lib/store/store";
import PublicProfilePage from "./page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/profile/alex",
  useSearchParams: () => new URLSearchParams(),
}));

const mockProfile: PublicUserProfile = {
  id: "u-99",
  name: "Alex River",
  username: "alex",
  bio: "Visual storyteller.",
  avatarUrl: "https://example.com/alex.jpg",
  postsCount: 10,
  followersCount: 250,
  followingCount: 80,
  isFollowing: false,
};

const mockPost: Post = {
  id: "p-1",
  caption: "First sunset in Kyoto",
  imageUrl: "https://example.com/kyoto.jpg",
  createdAt: "2026-10-20T10:00:00Z",
  author: { id: "u-99", name: "Alex River", username: "alex" },
  likesCount: 15,
  commentsCount: 2,
  isLiked: false,
  isSaved: false,
};

function mockHooksState({
  profile = null, isLoading = false, isError = false, posts = [], likedPosts = [],
}: {
  profile?: PublicUserProfile | null; isLoading?: boolean; isError?: boolean;
  posts?: readonly Post[]; likedPosts?: readonly Post[];
}) {
  vi.spyOn(hooks, "usePublicProfile").mockReturnValue({
    profile, isLoading, isError, error: isError ? new Error("User not found") : null, refetch: vi.fn(),
  });
  vi.spyOn(hooks, "useUserPosts").mockReturnValue({
    posts, isLoading: false, isError: false, error: null, refetch: vi.fn(),
  });
  vi.spyOn(hooks, "useUserLikes").mockReturnValue({
    likedPosts, isLoading: false, isError: false, error: null, refetch: vi.fn(),
  });
}

describe("PublicProfilePage", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  function renderWithProviders(ui: ReactNode) {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </Provider>,
    );
  }

  it("renders loading skeleton while profile is loading", () => {
    mockHooksState({ isLoading: true });
    renderWithProviders(<PublicProfilePage params={{ username: "alex" }} />);
    expect(screen.getByLabelText("Loading profile")).toBeInTheDocument();
  });

  it("renders 404 user not found error state and navigates back to search", () => {
    mockHooksState({ isError: true });
    renderWithProviders(<PublicProfilePage params={{ username: "nonexistent" }} />);

    expect(screen.getByRole("heading", { name: "User not found" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Back to search/i }));
    expect(mockPush).toHaveBeenCalledWith("/users/search");
  });

  it("renders loaded profile, posts tab by default, and switches to likes tab", async () => {
    mockHooksState({ profile: mockProfile, posts: [mockPost] });
    const paramsPromise = Promise.resolve({ username: "alex" });

    await act(async () => {
      renderWithProviders(<PublicProfilePage params={paramsPromise} />);
    });

    expect(screen.getByRole("heading", { level: 1, name: "Alex River" })).toBeInTheDocument();
    expect(screen.getAllByText("@alex").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("First sunset in Kyoto")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Likes" }));
    expect(screen.getByText("No liked posts yet")).toBeInTheDocument();
  });

  it("displays empty posts state and detects self profile", () => {
    store.dispatch(
      setSession({ token: "t", sessionId: "s", user: { username: "alex" } }),
    );
    mockHooksState({ profile: mockProfile, posts: [] });

    renderWithProviders(<PublicProfilePage params={{ username: "alex" }} />);

    expect(screen.getByText("No posts yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeInTheDocument();
  });
});
