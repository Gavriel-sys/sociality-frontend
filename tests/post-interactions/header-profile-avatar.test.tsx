import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FeedPage from "@/app/(private)/feed/page";
import { Header } from "@/components/layout/header";
import { setSession } from "@/features/auth/auth-slice";
import { normalizeUserProfile } from "@/features/profile/types";
import { createInteractionTestContext, jsonResponse } from "./test-support";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/feed",
  useSearchParams: () => new URLSearchParams(),
}));

const profile = { id: 1, name: "Profile Explorer", username: "davis", avatarUrl: "/avatars/davis.jpg" };
beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com"));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("current account header avatar", () => {
  it("fetches the current profile on /feed when the saved login has no avatar", async () => {
    const fetchRequest = vi.fn<typeof fetch>().mockImplementation(async (request) =>
      jsonResponse(new URL(String(request)).pathname === "/api/me"
        ? { success: true, data: { profile, stats: {} } }
        : { data: { posts: [] } }),
    );
    vi.stubGlobal("fetch", fetchRequest);
    const context = createInteractionTestContext();
    context.store.dispatch(setSession({
      token: "test-jwt", sessionId: "session-alex", user: { name: profile.name, username: profile.username },
    }));
    const view = render(<FeedPage />, context);

    const avatar = await screen.findByRole("img", { name: "Current user profile" });

    expect(avatar).toHaveAttribute("src", profile.avatarUrl);
    expect(screen.queryByText("PE")).not.toBeInTheDocument();
    const profileRequest = fetchRequest.mock.calls.find(([request]) => new URL(String(request)).pathname === "/api/me");
    expect(new Headers(profileRequest?.[1]?.headers).get("Authorization")).toBe("Bearer test-jwt");
    view.unmount();
    context.queryClient.clear();
  });

  it("updates a cached avatar and recovers after an earlier image failed", async () => {
    const context = createInteractionTestContext();
    const profileKey = ["private", "session-alex", "me"];
    context.queryClient.setQueryData(profileKey, normalizeUserProfile(profile));
    const view = render(<Header />, context);
    const avatar = await screen.findByRole("img", { name: "Current user profile" });
    fireEvent.error(avatar);
    expect(screen.getByLabelText("Current user profile")).toHaveTextContent("PE");

    act(() => context.queryClient.setQueryData(profileKey, normalizeUserProfile({ ...profile, avatarUrl: "/avatars/updated.jpg" })));

    expect(await screen.findByRole("img", { name: "Current user profile" })).toHaveAttribute("src", "/avatars/updated.jpg");
    view.unmount();
    context.queryClient.clear();
  });
});
