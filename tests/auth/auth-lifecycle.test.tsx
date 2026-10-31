import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MeProfilePage from "@/app/(private)/me/page";
import { clearSession as clearAuthSlice, setSession } from "@/features/auth/auth-slice";
import { registerSchema } from "@/features/auth/schemas";
import { clearSession as clearStorageSession, loadSession, saveSession } from "@/features/auth/session-storage";
import type { SessionData } from "@/features/auth/types";
import { useLogout } from "@/features/auth/use-logout";
import type { UserProfile } from "@/features/profile/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";

const mockPush = vi.fn();
let mockPathname = "/me";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

const mockProfileResponse: UserProfile = {
  id: "u-e2e-101",
  name: "Alex Vance",
  username: "alex101",
  email: "alex@example.com",
  bio: "Building the future of social web.",
  postsCount: 8,
  followersCount: 420,
  followingCount: 99, likesCount: 0,
};

function createTestWrapper(store: AppStore, queryClient: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

describe("E2E Auth Lifecycle Integration", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockPathname = "/me";
    store = makeStore();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("validates register schema with correct constraints", () => {
    const invalidRegistration = registerSchema.safeParse({ username: "a", email: "bad", password: "123" });
    expect(invalidRegistration.success).toBe(false);

    const registration = {
      name: "Alex Vance",
      username: "valid_user",
      email: "valid@example.com",
      password: "ValidPassword123!",
      confirmPassword: "ValidPassword123!",
      phone: "08123456789",
    };
    const validRegistration = registerSchema.safeParse(registration);
    expect(validRegistration.success).toBe(true);
    expect(registerSchema.safeParse({ ...registration, email: undefined }).success).toBe(false);
    expect(registerSchema.safeParse({ ...registration, phone: undefined }).success).toBe(true);
  });

  it("completes full auth lifecycle: login -> profile hydrate -> me view -> logout", async () => {
    // 1. User logs in: mock returns JWT token & session
    const mockSession: SessionData = {
      token: "jwt-token-alex-xyz",
      sessionId: "session-alex-101",
      user: { id: "u-e2e-101", username: "alex101" },
    };

    // 2. Save to storage & hydrate into Redux
    saveSession(mockSession);
    store.dispatch(setSession(mockSession));

    expect(loadSession()).toEqual(mockSession);
    expect(store.getState().auth.status).toBe("authenticated");

    // 3. User accesses /me -> profile fetches and renders
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(mockProfileResponse);
    const Wrapper = createTestWrapper(store, queryClient);

    render(createElement(Wrapper, null, createElement(MeProfilePage)));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Alex Vance" })).toBeInTheDocument();
    });

    expect(screen.getByText("alex101")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("420")).toBeInTheDocument();
    expect(screen.getByText("99")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Gallery" })).toHaveAttribute("aria-selected", "true");

    const clearQueryCacheSpy = vi.spyOn(queryClient, "clear");
    const { result: logout } = renderHook(() => useLogout(), { wrapper: Wrapper });
    act(() => logout.current());

    // 5. Assert: storage cleared, Redux unauthenticated, cache purged, redirected to /login
    expect(loadSession()).toBeNull();
    expect(store.getState().auth.status).toBe("unauthenticated");
    expect(store.getState().auth.token).toBeNull();
    expect(clearQueryCacheSpy).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("guards /me and redirects unauthenticated users to /login?returnTo=%2Fme", () => {
    clearStorageSession();
    store.dispatch(clearAuthSlice());

    const Wrapper = createTestWrapper(store, queryClient);
    render(createElement(Wrapper, null, createElement(MeProfilePage)));

    expect(mockPush).toHaveBeenCalledWith("/login?returnTo=%2Fme");
    expect(screen.queryByRole("heading", { level: 1, name: "Alex Vance" })).not.toBeInTheDocument();
  });
});
