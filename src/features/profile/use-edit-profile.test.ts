import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { clearSession as clearStorage, loadSession } from "@/features/auth/session-storage";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import type { UserProfile } from "./types";
import { useEditProfile } from "./use-edit-profile";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/me",
}));

function createWrapper(store: AppStore, queryClient: QueryClient) {
  return function TestWrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children),
    );
  };
}

const mockUpdatedProfile: UserProfile = {
  id: "user-42",
  name: "Alex Updated",
  username: "alexdev",
  email: "alex@example.com",
  bio: "Updated bio here",
  avatarUrl: "https://example.com/new-avatar.jpg",
  postsCount: 5,
  followersCount: 10,
  followingCount: 15,
};

describe("useEditProfile", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    clearStorage();
    store = makeStore();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    store.dispatch(
      setSession({
        token: "token-abc",
        sessionId: "sess-1",
        user: { id: "user-42", name: "Alex Developer", username: "alexdev", email: "alex@example.com" },
      }),
    );
  });

  it("submits multipart FormData when avatar is a File", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(mockUpdatedProfile);
    const { result } = renderHook(() => useEditProfile(), { wrapper: createWrapper(store, queryClient) });
    const mockFile = new File(["avatar data"], "avatar.png", { type: "image/png" });

    let updated: UserProfile | undefined;
    await act(async () => {
      updated = await result.current.editProfile({ name: "Alex Updated", bio: "Updated bio here", avatar: mockFile });
    });

    expect(updated).toEqual(mockUpdatedProfile);
    expect(apiSpy).toHaveBeenCalledTimes(1);
    const callArgs = apiSpy.mock.calls[0][0];
    expect(callArgs.endpoint).toBe("/api/me");
    expect(callArgs.method).toBe("PATCH");
    expect(callArgs.token).toBe("token-abc");
    const passedFormData = callArgs.body as FormData;
    expect(passedFormData.get("name")).toBe("Alex Updated");
    expect(passedFormData.get("bio")).toBe("Updated bio here");
    expect(passedFormData.get("avatar")).toBe(mockFile);
  });

  it("submits JSON payload when avatar is not a File", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(mockUpdatedProfile);
    const { result } = renderHook(() => useEditProfile(), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.editProfile({ name: "Alex Updated", bio: "Updated bio here" });
    });

    const callArgs = apiSpy.mock.calls[0][0];
    expect(callArgs.body).toEqual({ name: "Alex Updated", bio: "Updated bio here" });
  });

  it("dispatches updateUser to Redux and syncs session-storage on success", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(mockUpdatedProfile);
    const { result } = renderHook(() => useEditProfile(), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.editProfile({ name: "Alex Updated" });
    });

    expect(store.getState().auth.user?.name).toBe("Alex Updated");
    expect(store.getState().auth.user?.avatarUrl).toBe("https://example.com/new-avatar.jpg");
    const persisted = loadSession();
    expect(persisted?.user?.name).toBe("Alex Updated");
  });

  it("invalidates private and public caches on success", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(mockUpdatedProfile);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useEditProfile(), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.editProfile({ name: "Alex Updated" });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["private", "sess-1", "me"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["public", "user", "alexdev"] });
  });

  it("redirects unauthenticated users to login and prevents API call", async () => {
    store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => useEditProfile(), { wrapper: createWrapper(store, queryClient) });

    let updated: UserProfile | undefined;
    await act(async () => {
      updated = await result.current.editProfile({ name: "Alex" });
    });

    expect(updated).toBeUndefined();
    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("handles API rejection and sets error state", async () => {
    const error = new Error("Failed to update profile");
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(error);
    const { result } = renderHook(() => useEditProfile(), { wrapper: createWrapper(store, queryClient) });

    await act(async () => {
      await result.current.editProfile({ name: "Alex Fail" });
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(error);
  });
});
