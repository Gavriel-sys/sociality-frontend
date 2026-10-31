import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import type { UserProfile } from "@/features/profile/types";
import * as useMyProfileModule from "@/features/profile/use-my-profile";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import MeProfilePage from "./page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/me",
  useSearchParams: () => new URLSearchParams(),
}));

const mockProfile: UserProfile = {
  id: "user-789", name: "Morgan Taylor", username: "morgantaylor",
  email: "morgan@example.com", bio: "Designer & builder.",
  avatarUrl: "https://example.com/avatar.jpg", postsCount: 24,
  followersCount: 500, followingCount: 180, likesCount: 0,
};

describe("MeProfilePage", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue([]);
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

  function mockProfileHook(profile?: UserProfile, isLoading = false, isError = false, error: Error | null = null, refetch = vi.fn()) {
    vi.spyOn(useMyProfileModule, "useMyProfile").mockReturnValue({ profile, isLoading, isError, error, refetch });
  }

  it("renders loading skeleton while profile is loading", () => {
    mockProfileHook(undefined, true);
    renderWithProviders(<MeProfilePage />);
    expect(screen.getByLabelText("Loading profile")).toBeInTheDocument();
  });

  it("renders error state when profile fails to load and supports retry", () => {
    const mockRefetch = vi.fn();
    mockProfileHook(undefined, false, true, new Error("Network timeout"), mockRefetch);

    renderWithProviders(<MeProfilePage />);
    expect(screen.getByText("Failed to load profile")).toBeInTheDocument();
    expect(screen.getByText("Network timeout")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Try again/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders only Gallery and Saved with Gallery selected initially", () => {
    mockProfileHook(mockProfile);
    renderWithProviders(<MeProfilePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Morgan Taylor" })).toBeInTheDocument();
    expect(screen.getByText("morgantaylor")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Gallery", "Saved"]);
    expect(screen.getByRole("tab", { name: "Gallery" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Gallery" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Account Details" })).not.toBeInTheDocument();
  });

  it("switches between the Gallery and Saved collections", async () => {
    mockProfileHook(mockProfile);
    renderWithProviders(<MeProfilePage />);

    expect(await screen.findByRole("heading", { name: "Your story starts here" })).toBeInTheDocument();
    expect(screen.getByText("Share your first post and let the world see your moments, passions, and memories. Make this space truly yours.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Saved" }));
    expect(await screen.findByText("No saved posts yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Gallery" }));
    expect(await screen.findByRole("button", { name: "Upload My First Post" })).toBeInTheDocument();
  });

  it("opens the post composer from Upload My First Post", async () => {
    mockProfileHook(mockProfile);
    renderWithProviders(<MeProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Upload My First Post" }));

    expect(screen.getByRole("dialog", { name: "Add Post" })).toBeInTheDocument();
  });

  it("opens followers dialog when followers counter is clicked", () => {
    mockProfileHook(mockProfile);
    renderWithProviders(<MeProfilePage />);

    const followersBtn = screen.getByRole("button", { name: "500 Followers" });
    fireEvent.click(followersBtn);
    expect(screen.getByRole("heading", { level: 2, name: "Followers" })).toBeInTheDocument();
  });

  it("opens edit profile dialog when Edit profile button is clicked", () => {
    mockProfileHook(mockProfile);
    renderWithProviders(<MeProfilePage />);

    const editBtn = screen.getByRole("button", { name: "Edit profile" });
    fireEvent.click(editBtn);
    expect(screen.getByRole("heading", { level: 2, name: "Edit profile" })).toBeInTheDocument();
  });
});
