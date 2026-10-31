import { describe, expect, it, vi } from "vitest";
import RootPage from "./page";

const mockRedirect = vi.fn<(url: string) => never>(() => {
  throw new Error("NEXT_REDIRECT");
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

describe("RootPage (/)", () => {
  it("redirects directly to /feed", () => {
    expect(RootPage).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledExactlyOnceWith("/feed");
  });
});
