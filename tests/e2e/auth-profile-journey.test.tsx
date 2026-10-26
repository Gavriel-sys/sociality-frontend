import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MeProfilePage from "@/app/(private)/me/page";
import { setSession } from "@/features/auth/auth-slice";
import { LoginForm } from "@/features/auth/components/login-form";
import { registerSchema } from "@/features/auth/schemas";
import { loadSession, saveSession } from "@/features/auth/session-storage";
import type { SessionData } from "@/features/auth/types";
import type { UserProfile } from "@/features/profile/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/me",
  useSearchParams: () => new URLSearchParams(),
}));

const initialProfile: UserProfile = {
  id: "u-journey-1", name: "Taylor Mason", username: "tmason", email: "taylor@example.com",
  bio: "Original bio text", postsCount: 5, followersCount: 120, followingCount: 45,
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

describe("E2E Auth and Profile Journey", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    store = makeStore();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("completes full auth and profile journey from register to logout teardown", async () => {
    // 1. Register schema validation
    const invalidReg = registerSchema.safeParse({ username: "a", email: "invalid", password: "1" });
    expect(invalidReg.success).toBe(false);

    const validReg = registerSchema.safeParse({
      name: "Taylor Mason", username: "tmason", email: "taylor@example.com", password: "Password123!",
    });
    expect(validReg.success).toBe(true);

    // 2. Login form submission
    const handleLoginSubmit = vi.fn();
    const loginRender = render(createElement(LoginForm, { onSubmit: handleLoginSubmit, isLoading: false }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taylor@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password123!" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(handleLoginSubmit).toHaveBeenCalledWith({ email: "taylor@example.com", password: "Password123!" });
    });
    loginRender.unmount();

    // 3. Session hydration
    const session: SessionData = {
      token: "jwt-tmason-token", sessionId: "sess-tmason-99",
      user: { id: "u-journey-1", username: "tmason", email: "taylor@example.com", name: "Taylor Mason" },
    };
    saveSession(session);
    store.dispatch(setSession(session));
    expect(loadSession()).toEqual(session);
    expect(store.getState().auth.status).toBe("authenticated");

    // 4. View /me profile
    let currentProfile: UserProfile = { ...initialProfile };
    vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async ({ endpoint, method, body }) => {
      if (endpoint === "/api/me" && method === "PATCH") {
        currentProfile = { ...currentProfile, ...(body as Partial<UserProfile>) };
        return currentProfile;
      }
      if (endpoint === "/api/me") return currentProfile;
      return {};
    });

    const Wrapper = createWrapper(store, queryClient);
    render(createElement(Wrapper, null, createElement(MeProfilePage)));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Taylor Mason" })).toBeInTheDocument();
    });
    expect(screen.getByText("@tmason")).toBeInTheDocument();
    expect(screen.getByText("Original bio text")).toBeInTheDocument();

    // 5. Open EditProfileDialog
    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    // 6. Update name and bio via PATCH /api/me
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Taylor Mason Updated" } });
    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "Updated bio text for testing." } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // 7. Verify updated profile on /me
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Taylor Mason Updated" })).toBeInTheDocument();
    });
    expect(screen.getByText("Updated bio text for testing.")).toBeInTheDocument();
    expect(store.getState().auth.user?.name).toBe("Taylor Mason Updated");

    // 8. Logout action
    const clearCacheSpy = vi.spyOn(queryClient, "clear");
    fireEvent.click(screen.getByRole("button", { name: /Log out/i }));

    // 9. Verify 3-layer teardown
    expect(loadSession()).toBeNull();
    expect(store.getState().auth.status).toBe("unauthenticated");
    expect(store.getState().auth.token).toBeNull();
    expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
  }, 15000);
});
