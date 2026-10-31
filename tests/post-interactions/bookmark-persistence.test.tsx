import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PostCard } from "@/features/posts/components/post-card";
import { createInteractionTestContext, jsonResponse, post } from "./test-support";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/feed" }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("restores bookmarks after reload when feed posts omit isSaved, and persists save/unsave", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
  let savedPosts = [post];
  const fetchRequest = vi.fn<typeof fetch>().mockImplementation(async (request, options) => {
    const pathname = new URL(String(request)).pathname;
    if (pathname === "/api/me/saved") return jsonResponse({ data: { posts: savedPosts } });
    if (pathname.endsWith("/save")) {
      savedPosts = options?.method === "DELETE" ? [] : [post];
      return jsonResponse({ success: true });
    }
    return jsonResponse([]);
  });
  vi.stubGlobal("fetch", fetchRequest);
  const firstRender = render(<PostCard post={post} />, createInteractionTestContext());
  await screen.findByRole("button", { name: "Remove from saved" });
  firstRender.unmount();

  const reloadedRender = render(<PostCard post={post} />, createInteractionTestContext());
  fireEvent.click(await screen.findByRole("button", { name: "Remove from saved" }));
  await waitFor(() => expect(savedPosts).toEqual([]));
  await screen.findByRole("button", { name: "Save post" });
  reloadedRender.unmount();

  const unsavedContext = createInteractionTestContext();
  const unsavedRender = render(<PostCard post={post} />, unsavedContext);
  await waitFor(() => expect(unsavedContext.queryClient.getQueryData(["private", "session-alex", "saved"])).toEqual([]));
  fireEvent.click(await screen.findByRole("button", { name: "Save post" }));
  await waitFor(() => expect(savedPosts).toHaveLength(1));
  await screen.findByRole("button", { name: "Remove from saved" });
  unsavedRender.unmount();

  render(<PostCard post={post} />, createInteractionTestContext());
  expect(await screen.findByRole("button", { name: "Remove from saved" })).toHaveAttribute("aria-pressed", "true");
});
