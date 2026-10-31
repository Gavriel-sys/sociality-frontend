import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { useMySavedPosts } from "@/features/profile/use-my-collections";
import { createInteractionTestContext, jsonResponse, post } from "./test-support";

beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("useMySavedPosts", () => {
  it("loads every page into the exact session-scoped saved key", async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) => ({ ...post, id: index + 1 }));
    const fetchRequest = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ data: { posts: firstPage } }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ ...post, id: 11 }] }));
    vi.stubGlobal("fetch", fetchRequest);
    const { queryClient, wrapper } = createInteractionTestContext();
    const { result } = renderHook(() => useMySavedPosts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(11);
    expect(result.current.data?.every((savedPost) => savedPost.isSaved)).toBe(true);
    expect(queryClient.getQueryData(["private", "session-alex", "saved"])).toEqual(result.current.data);
    expect(fetchRequest.mock.calls[1][0]).toContain("page=2");
    expect(new Headers(fetchRequest.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer test-jwt");
  });

  it("skips the request for guests and switches collections with the session", async () => {
    const fetchRequest = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ data: { posts: [post] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { posts: [] } }));
    vi.stubGlobal("fetch", fetchRequest);
    const { store, wrapper } = createInteractionTestContext();
    store.dispatch(clearSession());
    const { result } = renderHook(() => useMySavedPosts(), { wrapper });
    expect(fetchRequest).not.toHaveBeenCalled();

    act(() => { store.dispatch(setSession({ token: "first-jwt", sessionId: "first-user" })); });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    act(() => { store.dispatch(setSession({ token: "second-jwt", sessionId: "second-user" })); });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(new Headers(fetchRequest.mock.calls[1][1]?.headers).get("Authorization")).toBe("Bearer second-jwt");
  });
});
