import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicProfilePage from "@/app/profile/[username]/page";
import UsersSearchPage from "@/app/users/search/page";
import { setSession } from "@/features/auth/auth-slice";
import type { PublicUserProfile } from "@/features/profile/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";

let mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/users/search",
  useSearchParams: () => mockSearchParams,
}));

const mockPublicProfile: PublicUserProfile = {
  id: "u-marcus", name: "Marcus Aurelius", username: "marcus", bio: "Philosopher emperor.",
  postsCount: 12, followersCount: 100, followingCount: 30, isFollowing: false,
};

function createWrapper(store: AppStore, queryClient: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

describe("E2E Social Graph Journey", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams("q=marcus");
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("completes search -> navigate profile -> follow -> view dialog -> unfollow journey", async () => {
    let isFollowingState = false;
    let followersCount = 100;

    vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async ({ endpoint, method }) => {
      if (endpoint.includes("/api/users/search")) {
        return {
          users: [{ id: "u-marcus", name: "Marcus Aurelius", username: "marcus", bio: "Philosopher emperor." }],
          total: 1,
        };
      }
      if (endpoint.includes("/followers")) {
        return [{ id: "u-fan", name: "Loyal Citizen", username: "citizen1" }];
      }
      if (endpoint.includes("/follow")) {
        if (method === "POST") {
          isFollowingState = true;
          followersCount += 1;
        } else if (method === "DELETE") {
          isFollowingState = false;
          followersCount -= 1;
        }
        return { success: true };
      }
      if (endpoint === "/api/users/marcus") {
        return { ...mockPublicProfile, isFollowing: isFollowingState, followersCount };
      }
      return [];
    });

    const Wrapper = createWrapper(store, queryClient);

    // 1. Search user in /users/search
    const searchRender = render(createElement(Wrapper, null, createElement(UsersSearchPage)));
    expect(await screen.findByText("Marcus Aurelius")).toBeInTheDocument();
    expect(screen.getByText("@marcus")).toBeInTheDocument();

    // 2. Select user and navigate to /profile/[username]
    const profileLink = screen.getByLabelText("View Marcus Aurelius's profile");
    expect(profileLink).toHaveAttribute("href", "/profile/marcus");
    searchRender.unmount();

    // 3. Inspect public profile stats
    store.dispatch(setSession({
      token: "jwt-curt-token", sessionId: "sess-curt-1",
      user: { id: "u-curt", username: "curt_user" },
    }));

    render(createElement(Wrapper, null, createElement(PublicProfilePage, { params: { username: "marcus" } })));

    expect(await screen.findByRole("heading", { level: 1, name: "Marcus Aurelius" })).toBeInTheDocument();
    expect(screen.getByText("Philosopher emperor.")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "100 Followers" })).toBeInTheDocument();

    // 4. Click Follow button
    const followButton = screen.getByRole("button", { name: "Follow" });
    fireEvent.click(followButton);

    // 5. Verify optimistic button switch to "Following" and follower counter increment
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "101 Followers" })).toBeInTheDocument();
    });

    // 6. Open Followers/Following dialog (UserListDialog)
    fireEvent.click(screen.getByRole("button", { name: "101 Followers" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Followers" })).toBeInTheDocument();
    expect(await screen.findByText("Loyal Citizen")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close dialog"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // 7. Switch back to Unfollow
    fireEvent.click(screen.getByRole("button", { name: "Following" }));

    // 8. Verify counter decrement
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "100 Followers" })).toBeInTheDocument();
    });
  }, 15000);
});
