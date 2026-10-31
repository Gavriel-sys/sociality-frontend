import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "@/app/(auth)/register/page";
import MeProfilePage from "@/app/(private)/me/page";
import { loadSession } from "@/features/auth/session-storage";
import { useLogout } from "@/features/auth/use-logout";
import type { UserProfile } from "@/features/profile/types";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import { fillRegistrationForm, registrationResponse } from "../auth/registration-fixture";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/me",
  useSearchParams: () => new URLSearchParams(),
}));

const initialProfile: UserProfile = {
  id: "u-journey-1", name: "Taylor Mason", username: "tmason", email: "taylor@example.com",
  bio: "Original bio text", postsCount: 5, followersCount: 120, followingCount: 45, likesCount: 0,
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
    let currentProfile: UserProfile = { ...initialProfile };
    const fetchApi = vi.spyOn(apiFetchModule, "apiFetch").mockImplementation(async ({ endpoint, method, body }) => {
      if (endpoint === "/api/auth/register") return registrationResponse;
      if (endpoint === "/api/me" && method === "PATCH") {
        currentProfile = { ...currentProfile, ...(body as Partial<UserProfile>) };
        return currentProfile;
      }
      if (endpoint === "/api/me") return currentProfile;
      return {};
    });

    const Wrapper = createWrapper(store, queryClient);
    const registrationRender = render(createElement(Wrapper, null, createElement(RegisterPage)));
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/feed"));
    expect(mockPush).not.toHaveBeenCalledWith("/me");
    expect(fetchApi).toHaveBeenCalledWith({
      endpoint: "/api/auth/register", method: "POST",
      body: { name: "Taylor Mason", username: "tmason", email: "taylor@example.com",
        password: "Password123!", phone: "08123456789" },
    });
    expect(loadSession()).toEqual({ ...registrationResponse.data, sessionId: expect.any(String) });
    expect(store.getState().auth.status).toBe("authenticated");
    registrationRender.unmount();

    render(createElement(Wrapper, null, createElement(MeProfilePage)));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Taylor Mason" })).toBeInTheDocument();
    });
    expect(screen.getByText("tmason")).toBeInTheDocument();
    expect(screen.getByText("Original bio text")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Taylor Mason Updated" } });
    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "Updated bio text for testing." } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Taylor Mason Updated" })).toBeInTheDocument();
    });
    expect(screen.getByText("Updated bio text for testing.")).toBeInTheDocument();
    expect(store.getState().auth.user?.name).toBe("Taylor Mason Updated");

    const clearCacheSpy = vi.spyOn(queryClient, "clear");
    const { result: logout } = renderHook(() => useLogout(), { wrapper: Wrapper });
    act(() => logout.current());

    expect(loadSession()).toBeNull();
    expect(store.getState().auth.status).toBe("unauthenticated");
    expect(store.getState().auth.token).toBeNull();
    expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
  }, 15000);
});
