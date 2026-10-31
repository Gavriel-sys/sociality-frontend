import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PostCard } from "@/features/posts/components/post-card";
import { ProfilePostCollection } from "@/features/profile/components/profile-post-collection";
import { createInteractionTestContext, jsonResponse, post } from "./test-support";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/feed" }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("uses the liked collection over stale feed state and synchronizes unlike back to Feed", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
  let likedPosts = [{ ...post, isLiked: true, likesCount: 9 }];
  const fetchRequest = vi.fn<typeof fetch>().mockImplementation(async (request, options) => {
    const pathname = new URL(String(request)).pathname;
    if (pathname === "/api/me/likes") return jsonResponse({ data: { posts: likedPosts } });
    if (pathname.endsWith("/like")) {
      likedPosts = options?.method === "DELETE" ? [] : [{ ...post, isLiked: true, likesCount: 9 }];
      return jsonResponse({ success: true });
    }
    return jsonResponse([]);
  });
  vi.stubGlobal("fetch", fetchRequest);
  const context = createInteractionTestContext();
  context.queryClient.setQueryData(["private", "session-alex", "feed", {}], { pages: [[post]], pageParams: [1] });
  const profileRender = render(<ProfilePostCollection collection="likes" />, context);
  const unlikeButton = await screen.findByRole("button", { name: "Unlike post" });
  expect(screen.getByRole("button", { name: "View likes" })).toHaveTextContent("9");

  fireEvent.click(unlikeButton);

  expect(await screen.findByText("No liked posts yet")).toBeInTheDocument();
  await waitFor(() => expect(fetchRequest.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(true));
  profileRender.unmount();
  render(<PostCard post={post} />, context);
  expect(screen.getByRole("button", { name: "View likes" })).toHaveTextContent("8");

  fireEvent.click(screen.getByRole("button", { name: "Like post" }));

  await screen.findByRole("button", { name: "Unlike post" });
  await waitFor(() => expect(fetchRequest.mock.calls.some(([, options]) => options?.method === "POST")).toBe(true));
  expect(context.queryClient.getQueryData(["private", "session-alex", "likes"])).toEqual(likedPosts);
});
