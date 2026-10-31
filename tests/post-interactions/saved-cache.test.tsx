import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePostSaveToggle } from "@/features/posts/use-post-save-toggle";
import { createInteractionTestContext, jsonResponse, post } from "./test-support";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/feed" }));
const savedKey = ["private", "session-alex", "saved"] as const;
const feedKey = ["private", "session-alex", "feed", {}] as const;
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("saved collection mutation cache", () => {
  it("adds a complete post to saved and invalidates the collection", async () => {
    const fetchRequest = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchRequest);
    const { queryClient, wrapper } = createInteractionTestContext();
    queryClient.setQueryData(savedKey, []);
    queryClient.setQueryData(feedKey, { pages: [[post]], pageParams: [1] });
    const { result } = renderHook(() => usePostSaveToggle(post), { wrapper });

    await act(async () => { await result.current.toggleSave(); });

    expect(queryClient.getQueryData(savedKey)).toEqual([{ ...post, isSaved: true }]);
    expect(queryClient.getQueryState(savedKey)?.isInvalidated).toBe(true);
    expect(result.current.isSaved).toBe(true);
    expect(fetchRequest.mock.calls[0][1]?.method).toBe("POST");
  });

  it("uses saved membership for DELETE, removes immediately, and rolls back failure", async () => {
    let finishRequest: (response: Response) => void = () => {};
    const fetchRequest = vi.fn<typeof fetch>().mockImplementation(() => new Promise((resolve) => { finishRequest = resolve; }));
    vi.stubGlobal("fetch", fetchRequest);
    const { queryClient, wrapper } = createInteractionTestContext();
    const savedPost = { ...post, id: String(post.id), isSaved: true };
    queryClient.setQueryData(savedKey, [savedPost]);
    queryClient.setQueryData(feedKey, { pages: [[post]], pageParams: [1] });
    const { result } = renderHook(() => usePostSaveToggle(post), { wrapper });

    expect(result.current.isSaved).toBe(true);
    act(() => { void result.current.toggleSave(); void result.current.toggleSave(); });
    await waitFor(() => expect(queryClient.getQueryData(savedKey)).toEqual([]));
    expect(result.current.isSaved).toBe(false);
    expect(fetchRequest).toHaveBeenCalledTimes(1);
    expect(fetchRequest.mock.calls[0][1]?.method).toBe("DELETE");
    await act(async () => { finishRequest(new Response("Failed", { status: 500 })); });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(queryClient.getQueryData(savedKey)).toEqual([savedPost]);
    expect(result.current.isSaved).toBe(true);
  });

  it("removes a saved post and invalidates the collection after DELETE succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: true })));
    const { queryClient, wrapper } = createInteractionTestContext();
    queryClient.setQueryData(savedKey, [{ ...post, isSaved: true }]);
    const { result } = renderHook(() => usePostSaveToggle(post), { wrapper });

    await act(async () => { await result.current.toggleSave(); });

    expect(queryClient.getQueryData(savedKey)).toEqual([]);
    expect(queryClient.getQueryState(savedKey)?.isInvalidated).toBe(true);
    expect(result.current.isSaved).toBe(false);
  });
});
