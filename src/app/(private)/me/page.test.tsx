import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import type { UserProfile } from "@/features/profile/types";
import * as useMyProfileModule from "@/features/profile/use-my-profile";
import { makeStore, type AppStore } from "@/lib/store/store";
import MeProfilePage from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/me",
  useSearchParams: () => new URLSearchParams(),
}));

const mockProfile: UserProfile = {
  id: "user-789",
  name: "Morgan Taylor",
  username: "morgantaylor",
  email: "morgan@example.com",
  bio: "Designer & builder.",
  avatarUrl: "https://example.com/avatar.jpg",
  postsCount: 24,
  followersCount: 500,
  followingCount: 180,
};

describe("MeProfilePage", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    store.dispatch(
      setSession({ token: "test-token", sessionId: "test-session", user: { username: "morgantaylor" } }),
    );
  });

  function renderWithProviders(ui: ReactNode) {
    return render(
      <Provider store={store}><QueryClientProvider client={queryClient}>{ui}</QueryClientProvider></Provider>,
    );
  }

  it("renders loading skeleton while profile is loading", () => {
    vi.spyOn(useMyProfileModule, "useMyProfile").mockReturnValue({
      profile: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<MeProfilePage />);

    expect(screen.getByLabelText("Loading profile")).toBeInTheDocument();
  });

  it("renders error state when profile fails to load and supports retry", () => {
    const mockRefetch = vi.fn();
    vi.spyOn(useMyProfileModule, "useMyProfile").mockReturnValue({
      profile: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network timeout"),
      refetch: mockRefetch,
    });

    renderWithProviders(<MeProfilePage />);

    expect(screen.getByText("Failed to load profile")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Try again/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders profile header and overview tab when profile loads", () => {
    vi.spyOn(useMyProfileModule, "useMyProfile").mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<MeProfilePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Morgan Taylor" }),
    ).toBeInTheDocument();
    expect(screen.getByText("@morgantaylor")).toBeInTheDocument();
    expect(screen.getByText("morgan@example.com")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Posts, Saved, and Liked collections will be integrated in Stages 3–5.",
      ),
    ).toBeInTheDocument();
  });

  it("displays empty states when switching to non-overview tabs", () => {
    vi.spyOn(useMyProfileModule, "useMyProfile").mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<MeProfilePage />);

    const postsTab = screen.getByRole("tab", { name: "Posts" });
    fireEvent.click(postsTab);

    expect(screen.getByText("No posts yet")).toBeInTheDocument();
  });

  it("opens followers dialog when followers counter is clicked", () => {
    vi.spyOn(useMyProfileModule, "useMyProfile").mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<MeProfilePage />);

    const followersBtn = screen.getByRole("button", { name: "500 Followers" });
    fireEvent.click(followersBtn);

    expect(screen.getByRole("heading", { level: 2, name: "Followers" })).toBeInTheDocument();
  });
});
