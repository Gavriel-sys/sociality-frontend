import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { makeStore, type AppStore } from "@/lib/store/store";
import type { Post } from "./types";
import { useCreatePost } from "./use-create-post";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/feed",
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

const mockPostResponse: Post = {
  id: "p-new-1",
  caption: "My uploaded post",
  imageUrl: "https://example.com/img.jpg",
  createdAt: "2026-10-25T12:00:00Z",
  author: { id: "u-1", name: "User", username: "tester" },
  likesCount: 0,
  commentsCount: 0,
  isLiked: false,
  isSaved: false,
};

describe("useCreatePost", () => {
  let store: AppStore;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    store.dispatch(setSession({ token: "token-abc", sessionId: "sess-1", user: { username: "tester" } }));
  });

  it("submits multipart FormData and returns created post", async () => {
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(mockPostResponse);
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper(store, queryClient) });
    const mockFile = new File(["dummy content"], "photo.png", { type: "image/png" });

    let created: Post | undefined;
    await act(async () => {
      created = await result.current.createPost({ image: mockFile, caption: "My uploaded post" });
    });

    expect(created).toEqual(mockPostResponse);
    expect(apiSpy).toHaveBeenCalledTimes(1);
    const callArgs = apiSpy.mock.calls[0][0];
    expect(callArgs.endpoint).toBe("/api/posts");
    expect(callArgs.method).toBe("POST");
    expect(callArgs.token).toBe("token-abc");
    const passedFormData = callArgs.body as FormData;
    expect(passedFormData.get("image")).toBe(mockFile);
    expect(passedFormData.get("caption")).toBe("My uploaded post");
  });

  it("invalidates post, feed, and explore queries on successful creation", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValueOnce(mockPostResponse);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper(store, queryClient) });
    const mockFile = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.createPost({ image: mockFile });
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it("redirects unauthenticated users to login and prevents API call", async () => {
    store.dispatch(clearSession());
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch");
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper(store, queryClient) });
    const mockFile = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });

    let outcome: Post | undefined;
    await act(async () => {
      outcome = await result.current.createPost({ image: mockFile, caption: "Test" });
    });

    expect(outcome).toBeUndefined();
    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("handles API rejection gracefully by returning undefined", async () => {
    vi.spyOn(apiFetchModule, "apiFetch").mockRejectedValueOnce(new Error("Upload failed"));
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper(store, queryClient) });
    const mockFile = new File(["dummy"], "photo.png", { type: "image/png" });

    let res: Post | undefined;
    await act(async () => {
      res = await result.current.createPost({ image: mockFile });
    });

    expect(res).toBeUndefined();
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe("Upload failed");
  });

  it("prevents duplicate concurrent calls while creation is in flight", async () => {
    let resolver: (v: unknown) => void = () => {};
    const pending = new Promise((resolve) => { resolver = resolve; });
    const apiSpy = vi.spyOn(apiFetchModule, "apiFetch").mockReturnValue(pending as Promise<unknown>);
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper(store, queryClient) });
    const mockFile = new File(["dummy"], "photo.png", { type: "image/png" });

    let firstRes: Post | undefined;
    let secondRes: Post | undefined;

    await act(async () => {
      const p1 = result.current.createPost({ image: mockFile });
      const p2 = result.current.createPost({ image: mockFile });
      resolver(mockPostResponse);
      [firstRes, secondRes] = await Promise.all([p1, p2]);
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);
    expect(firstRes).toEqual(mockPostResponse);
    expect(secondRes).toBeUndefined();
  });
});
