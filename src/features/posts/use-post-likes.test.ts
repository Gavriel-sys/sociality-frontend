import { createElement } from "react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore } from "@/lib/store/store";
import type { AppStore } from "@/lib/store/store";
import { usePostLikes } from "./use-post-likes";

const likedUser = { id: "u-1", name: "Alex", username: "alex", avatarUrl: "/alex.jpg" };
const likesResponse = { success: true, data: { users: [likedUser] } };

function createContext(store?: AppStore) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { readonly children: ReactNode }) {
    const content = createElement(QueryClientProvider, { client: queryClient }, children);
    const StoreProvider = Provider as (props: { store: AppStore; children?: ReactNode }) => ReactNode;
    return store ? createElement(StoreProvider, { store }, content) : content;
  }
  return { wrapper: Wrapper, queryClient };
}

afterEach(() => vi.restoreAllMocks());

describe("usePostLikes", () => {
  it.each([42, "post /?#"])("fetches and normalizes likes for post %s without authentication", async (postId) => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({
      success: true, data: { users: [{ userId: "u-1", fullName: "Alex", handle: "alex", avatarUrl: "/alex.jpg" }] },
    });
    const context = createContext();
    const { result } = renderHook(() => usePostLikes(postId), context);

    expect(result.current.isLoading).toBe(true);
    expect(result.current.users).toEqual([]);
    await waitFor(() => expect(result.current.users).toEqual([likedUser]));

    expect(result.current.isError).toBe(false);
    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: `/api/posts/${encodeURIComponent(String(postId))}/likes`,
      method: "GET", token: undefined, signal: expect.any(AbortSignal),
    }));
    expect(context.queryClient.getQueryData(["public", "post", String(postId), "likes"])).toEqual([likedUser]);
  });

  it("passes the current session token to apiFetch", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(likesResponse);
    const store = makeStore();
    store.dispatch(setSession({ token: "likes-token", sessionId: "likes-session", user: { username: "alex" } }));

    const { result } = renderHook(() => usePostLikes(42), createContext(store));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiSpy).toHaveBeenCalledWith(expect.objectContaining({ token: "likes-token" }));
  });

  it("does not request likes for an empty post ID", () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => usePostLikes(""), createContext());

    expect(apiSpy).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ users: [], isLoading: false, isError: false });
  });

  it("waits until the dialog opens before requesting likes", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue(likesResponse);
    const { result, rerender } = renderHook(({ enabled }) => usePostLikes(42, enabled), {
      ...createContext(), initialProps: { enabled: false },
    });
    expect(apiSpy).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.users).toEqual([likedUser]));
    expect(apiSpy).toHaveBeenCalledTimes(1);
  });

  it("returns an empty list when the post has no likes", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ success: true, data: { users: [] } });
    const { result } = renderHook(() => usePostLikes(42), createContext());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current).toMatchObject({ users: [], isError: false });
  });

  it("exposes errors and allows retrying the request", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch")
      .mockRejectedValueOnce(new Error("Unable to load likes"))
      .mockResolvedValueOnce(likesResponse);
    const { result } = renderHook(() => usePostLikes(42), createContext());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.users).toEqual([]);

    await act(async () => { await result.current.refetch(); });

    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.users).toEqual([likedUser]);
    expect(apiSpy).toHaveBeenCalledTimes(2);
  });

  it("keeps the likes for different posts in separate cache entries", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(likesResponse)
      .mockResolvedValueOnce({ success: true, data: { users: [] } });
    const context = createContext();
    const { result, rerender } = renderHook(({ postId }) => usePostLikes(postId), {
      ...context, initialProps: { postId: "first" },
    });
    await waitFor(() => expect(result.current.users).toEqual([likedUser]));

    rerender({ postId: "second" });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.users).toEqual([]);
    expect(context.queryClient.getQueryData(["public", "post", "first", "likes"])).toEqual([likedUser]);
  });
});
